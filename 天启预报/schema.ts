// 天启预报 MVU schema（Zod v4）
// 阶位名词枚举 + 源质基础量 + 能力四子页签（技能/灵魂能力/威权/buff）+ 武器页签 + 已完成事件追加式
// z 与 _ 由 forge 全局注入，勿 import

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

const text = (fallback = '') => z.preprocess(
  (value) => (value === undefined || value === null ? fallback : String(value)),
  z.string().catch(fallback),
).prefault(fallback);

const nullableText = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? null : String(value)),
  z.string().nullable().catch(null),
).prefault(null);

const boundedNumber = (fallback, minimum, maximum) => z.coerce.number()
  .catch(fallback)
  .transform((value) => clamp(value, minimum, maximum))
  .prefault(fallback);

const nonNegativeInteger = (fallback = 0) => z.coerce.number()
  .int()
  .catch(fallback)
  .transform((value) => Math.max(0, value))
  .prefault(fallback);

const binaryFlag = z.coerce.number()
  .catch(1)
  .transform((value) => (value > 0 ? 1 : 0))
  .prefault(1);

// 阶位名词枚举（天启体系，非龙族数字阶）
const RankSchema = z.enum([
  '不入阶', '应激期', '发育期',
  '水银', '黄金', '以太', '星锑', '贤者之石',
  '天敌', '阶位未知',
]).catch('不入阶').prefault('不入阶');

// 凝固阶位（地狱侧"升华"，另一条圣痕路线：授名者→着衣者→冠戴者→统治者→地狱之王）
const CoagulationRankSchema = z.enum([
  '无', '授名者', '着衣者', '冠戴者', '统治者', '地狱之王',
]).catch('无').prefault('无');

// 源质基础量（按阶位）
const SOURCE_BASE = {
  '不入阶': 0, '应激期': 20, '发育期': 50,
  '水银': 100, '黄金': 200, '以太': 500, '星锑': 800, '贤者之石': 1200,
  '天敌': 9999, '阶位未知': 0,
};

// 技能（圣痕给予的 + 武道 + 其他，多条）
const SkillSchema = z.object({
  效果: text(''),
  消耗: z.preprocess(
    (v) => (v && typeof v === 'object' ? v : {}),
    z.object({
      源质: nonNegativeInteger(0),
      生命: nonNegativeInteger(0),
      修正值: z.coerce.number().catch(0),
      歪曲度: z.coerce.number().catch(0),
    }).prefault({}),
  ).prefault({}),
  来源: text(''),
  发动负荷: boundedNumber(0, 0, 100),
  每回合维持负荷: boundedNumber(0, 0, 100),
  使用条件: z.array(text('')).catch([]).prefault([]),
  特殊限制: z.array(text('')).catch([]).prefault([]),
  破阶标签: z.array(text('')).catch([]).prefault([]),
}).prefault({});

// 灵魂能力（个人本质，三条合成高一阶）
const SoulAbilitySchema = z.object({
  效果: text(''),
  阶位: boundedNumber(1, 1, 5),
}).prefault({});

// 威权（buff，非技能）
const AuthoritySchema = z.object({
  类型: z.enum(['威权', '神之楔']).catch('威权').prefault('威权'),
  效果: text(''),
  持续条件: text(''),
  限制: z.array(text('')).catch([]).prefault([]),
}).prefault({});

// 副职（灾厄乐师/厨魔/学者等，多职业并存，独立于升华与凝固）
const ProfessionSchema = z.object({
  等级: text(''),
  协会: text(''),
}).prefault({});

// 武器（类型统一为"武器"；武器类别自由填≤4字，仅描述武器长什么样，助 AI 理解形态）
const limitedText = (fallback, maxLength) => z.preprocess(
  (value) => (value === undefined || value === null ? fallback : String(value)),
  z.string().catch(fallback),
).transform((value) => String(value).slice(0, maxLength)).prefault(fallback);

const WEAPON_DAMAGE_RANGE = {
  '不入阶': [1, 4],
  '应激期': [2, 6],
  '发育期': [4, 8],
  '水银': [6, 12],
  '黄金': [10, 18],
  '以太': [14, 24],
  '星锑': [20, 30],
  '贤者之石': [26, 40],
  '天敌': [30, 50],
  '阶位未知': [1, 12],
};

const WeaponResourceSchema = z.object({
  类型: z.enum(['弹药', '充能', '源质']).catch('充能').prefault('充能'),
  当前: nonNegativeInteger(0),
  上限: nonNegativeInteger(0),
}).transform((r) => ({ ...r, 当前: Math.min(r.当前, r.上限) }));

const WeaponSchema = z.object({
  物品ID: text(''),
  名称: text('未命名武器'),
  类型: z.preprocess(
    (v) => (v === '普通武器' || v === '源质武装' || v === undefined || v === null ? '武器' : v),
    z.enum(['武器']).prefault('武器'),
  ),
  武器类别: limitedText('其他', 4),
  阶位: RankSchema,
  基础伤害: z.coerce.number().int().catch(0).prefault(0),
  命中修正: z.coerce.number().catch(0).prefault(0),
  破阶标签: z.array(text('')).catch([]).prefault([]),
  弹药或充能: WeaponResourceSchema.nullable().catch(null).prefault(null),
  状态: text('完好'),
  特殊效果: z.array(text('')).catch([]).prefault([]),
  有效距离: z.array(z.enum(['贴身', '近距', '中距', '远距', '超远']))
    .min(1).catch(['近距']).prefault(['近距']),
}).transform((w) => {
  const range = WEAPON_DAMAGE_RANGE[w.阶位] || WEAPON_DAMAGE_RANGE['阶位未知'];
  w.基础伤害 = clamp(Math.round(Number(w.基础伤害) || 0), range[0], range[1]);
  w.武器类别 = String(w.武器类别 || '其他').slice(0, 4);
  w.特殊效果 = (w.特殊效果 || []).map((e) => String(e).slice(0, 20)).filter(Boolean);
  return w;
});

const ItemSchema = z.object({
  物品ID: text(''),
  名称: text('未命名物品'),
  类型: text('普通物品'),
  数量: z.coerce.number().int().catch(1).transform((v) => Math.max(1, v)).prefault(1),
  说明: text(''),
});

// 战力（阶位 + 源质，源质上限由阶位自动推导）
const CombatPowerSchema = z.object({
  基础阶位: RankSchema,
  当前阶位: RankSchema,
  爆发态: z.object({
    名称: text(''),
    阶位: RankSchema,
    发动负荷: boundedNumber(0, 0, 100),
    每回合维持负荷: boundedNumber(0, 0, 100),
    限制: z.array(text('')).catch([]).prefault([]),
  }).nullable().catch(null).prefault(null),
  极限态: z.object({
    名称: text(''),
    阶位: RankSchema,
    发动负荷: boundedNumber(0, 0, 100),
    每回合维持负荷: boundedNumber(0, 0, 100),
    限制: z.array(text('')).catch([]).prefault([]),
  }).nullable().catch(null).prefault(null),
}).prefault({});

// 伤势
const InjurySchema = z.object({
  名称: text('未命名伤势'),
  严重度: text('重伤'),
  检定影响: z.coerce.number().catch(-2).transform((v) => Math.min(0, v)).prefault(-2),
  是否已处理: z.boolean().catch(false).prefault(false),
}).prefault({});

// 濒死
const DyingSchema = z.object({
  是否濒死: z.boolean().catch(false).prefault(false),
  成功次数: boundedNumber(0, 0, 3).transform(Math.trunc),
  失败次数: boundedNumber(0, 0, 3).transform(Math.trunc),
}).prefault({});

// 成长里程碑
const MilestoneConditionSchema = z.object({
  类型: z.enum(['掌握', '实战', '代价或稳定性']).catch('掌握').prefault('掌握'),
  条件: text(''),
  状态: z.enum(['未完成', '已完成']).catch('未完成').prefault('未完成'),
}).prefault({});

const CompletedMilestoneSchema = z.object({
  达成目标: text(''),
  完成于事件: text(''),
  完成时间: z.object({ 日期: text('未设定'), 时刻: text('未设定') }).prefault({}),
  提升前阶位: RankSchema,
  提升后阶位: RankSchema,
});

const GrowthSchema = z.object({
  下一目标: text(''),
  里程碑条件: z.array(z.union([MilestoneConditionSchema, text('')])).max(3).catch([]).prefault([]),
  已完成里程碑: z.array(CompletedMilestoneSchema).max(12).catch([]).prefault([]),
}).prefault({});

// 称号（只增不删的功绩勋章；字段固定"称号名/阶位/效果"，兼容模型误写"名称"）
const TitleSchema = z.preprocess((v) => {
  if (v && typeof v === 'object' && !('称号名' in v) && '名称' in v) {
    return { ...v, 称号名: v['名称'] };
  }
  return v;
}, z.object({
  称号名: text('未命名称号'),
  阶位: boundedNumber(1, 1, 5),
  效果: text(''),
  获得于事件: text(''),
  获得时间: z.object({ 日期: text('未设定'), 时刻: text('未设定') }).prefault({}),
}).prefault({}));

// 主角档案
const ProtagonistSchema = z.object({
  基础: z.object({
    姓名: text('{{user}}'),
    性别: text('未知'),
    年龄: z.preprocess(
      (v) => (v === undefined || v === null || v === '' ? null : Number(v)),
      z.number().int().min(0).max(999).nullable().catch(null),
    ).prefault(null),
    当前身份: text('未设定'),
    当前势力: text('无'),
    种族: text('人类'),
    谱系: text('未设定'),
    外貌: text(''),
    圣痕: z.array(z.union([z.object({ 名称: text(''), 日常: text(''), 激发: text('') }).prefault({}), text('')])).catch([]).prefault([]),
  }).prefault({}),
  战力: CombatPowerSchema,
  当前源质: boundedNumber(0, 0, 9999),
  源质上限: boundedNumber(0, 0, 9999),
  能力: z.object({
    技能: z.record(z.string(), SkillSchema).catch({}).prefault({}),
    灵魂能力: z.record(z.string(), SoulAbilitySchema).catch({}).prefault({}),
    威权: z.record(z.string(), AuthoritySchema).catch({}).prefault({}),
    职业: z.record(z.string(), ProfessionSchema).catch({}).prefault({}),
  }).prefault({}),
  武器: z.record(z.string(), WeaponSchema).catch({}).prefault({}),
  当前武器: WeaponSchema.nullable().catch(null).prefault(null),
  副手武器: WeaponSchema.nullable().catch(null).prefault(null),
  HP: z.object({ 当前: boundedNumber(100, 0, 100), 上限: z.literal(100).catch(100).prefault(100) }).prefault({}),
  战斗负荷: z.object({ 当前: boundedNumber(0, 0, 100), 上限: z.literal(100).catch(100).prefault(100) }).prefault({}),
  掩体状态: z.enum(['无', '半掩体', '全掩体']).catch('无').prefault('无'),
  当前状态: z.array(text('')).catch(['正常']).prefault(['正常']),
  当前形态: text('常态'),
  当前目标: text(''),
  生理状态: text('健康'),
  当前服饰: text(''),
  伤势: z.array(InjurySchema).catch([]).prefault([]),
  濒死: DyingSchema,
  生死状态: z.enum(['存活', '濒死', '昏迷稳定', '死亡']).catch('存活').prefault('存活'),
  修正值: z.coerce.number().catch(0).prefault(0),
  歪曲度: z.coerce.number().catch(0).prefault(0),
  凝固度: boundedNumber(0, 0, 200),
  凝固: z.object({
    阶位: CoagulationRankSchema,
    下一目标: text(''),
    里程碑条件: z.array(text('')).catch([]).prefault([]),
  }).prefault({}),
  成长: GrowthSchema,
  称号: z.array(TitleSchema).catch([]).prefault([]),
}).prefault({});

// NPC 档案（在场/不在场）
const NpcSchema = z.object({
  姓名: text('未命名NPC'),
  性别: text('未知'),
  年龄: z.preprocess(
    (v) => (v === undefined || v === null || v === '' ? null : Number(v)),
    z.number().int().min(0).max(999).nullable().catch(null),
  ).prefault(null),
  当前身份: text('未设定'),
  当前势力: text('无'),
  种族: text('人类'),
  谱系: text('未设定'),
  阶位: RankSchema,
  外观: text(''),
  与主角关系: text('陌生'),
  好感度: boundedNumber(0, -200, 200),
  恋人: z.union([z.boolean(), z.string()]).catch(false).prefault(false),
  当前位置: text('未知'),
  当前行动: text(''),
  当前情绪: text('平静'),
  当前心声: text(''),
  与主角距离: z.enum(['贴身', '近距', '中距', '远距', '超远']).catch('超远').prefault('超远'),
  HP: z.object({ 当前: boundedNumber(100, 0, 100), 上限: z.literal(100).catch(100).prefault(100) }).prefault({}),
  战斗负荷: z.object({ 当前: boundedNumber(0, 0, 100), 上限: z.literal(100).catch(100).prefault(100) }).prefault({}),
  随身物品: z.record(z.string(), z.union([WeaponSchema, ItemSchema])).catch({}).prefault({}),
  当前武器: WeaponSchema.nullable().catch(null).prefault(null),
}).prefault({});

// 上次检定
const resolveCheckLevel = (die, modifier, dc) => {
  const margin = die + modifier - dc;
  let index = margin < 0 ? 0 : margin >= 10 ? 3 : margin >= 5 ? 2 : 1;
  if (die === 1) index = 0;
  if (die === 20) index = Math.min(index + 1, 3);
  return ['失败', '成功', '强成功', '暴击'][index];
};

const LastCheckSchema = z.object({
  检定者: text(''),
  目标: text(''),
  检定类型: z.enum(['先手', '攻击', '圣痕', '闪避', '治疗', '濒死', '控制', '逃脱']),
  骰面: z.coerce.number().int().min(1).max(20),
  总修正: z.coerce.number().catch(0),
  总值: z.coerce.number().catch(0),
  难度DC: z.coerce.number().catch(10),
  防御反应: text(''),
  破阶依据: text(''),
  检定结果: z.enum(['失败', '成功', '强成功', '暴击', '无法破阶']),
  造成伤害: boundedNumber(0, 0, Number.MAX_SAFE_INTEGER).transform(Math.floor),
}).transform((check) => {
  const result = check.检定结果 === '无法破阶'
    ? '无法破阶'
    : resolveCheckLevel(check.骰面, check.总修正, check.难度DC);
  return {
    ...check,
    总值: check.骰面 + check.总修正,
    检定结果: result,
    造成伤害: result === '失败' || result === '无法破阶' ? 0 : check.造成伤害,
  };
});

const ActionBudgetSchema = z.object({
  主要行动: binaryFlag,
  移动: binaryFlag,
  防御反应: binaryFlag,
});

export const Schema = z.object({
  当前时间: z.object({
    日期: text('未设定'),
    时刻: text('未设定'),
  }).prefault({}),
  当前地点: z.object({
    名称: text('未设定'),
    区域: text(''),
    环境: text(''),
  }).prefault({}),
  当前事件: z.object({
    名称: text('未开始'),
    阶段: text('未开始'),
    场景物品: z.record(z.string(), ItemSchema).catch({}).prefault({}),
  }).prefault({}),
  当前幕: z.object({
    部: text(''),
    幕号: text('未开始'),
    幕名: text(''),
    状态: z.enum(['未开始', '进行中', '已完成', '已跳过']).catch('未开始').prefault('未开始'),
  }).prefault({}),
  战斗状态: z.object({
    是否战斗中: z.boolean().catch(false).prefault(false),
    当前回合: nonNegativeInteger(0),
    参战角色: z.array(text('')).catch([]).prefault([]),
    行动顺序: z.array(text('')).catch([]).prefault([]),
    当前行动者: nullableText,
    行动额度: z.record(z.string(), ActionBudgetSchema).catch({}).prefault({}),
    上次检定: LastCheckSchema.nullable().catch(null).prefault(null),
  }).prefault({}),
  玩家档案: ProtagonistSchema,
  物品栏: z.record(z.string(), z.union([WeaponSchema, ItemSchema])).catch({}).prefault({}),
  NPC档案: z.object({
    在场角色: z.record(z.string(), NpcSchema).catch({}).prefault({}),
    不在场角色: z.record(z.string(), NpcSchema).catch({}).prefault({}),
  }).prefault({}),
  世界: z.object({
    修正值: z.coerce.number().catch(0).prefault(0),
    歪曲度: z.coerce.number().catch(0).prefault(0),
    危险度: z.enum(['平静', '紧张', '危机', '濒临毁灭']).catch('紧张').prefault('紧张'),
  }).prefault({}),
  系统: z.object({
    已完成事件: text(''),
    随机事件开关: z.enum(['on', 'off']).catch('on').prefault('on'),
    随机事件冷却: nonNegativeInteger(0),
    上次方向: z.enum(['日常', '战斗', '探险']).nullable().catch(null).prefault(null),
    当前目标: text(''),
  }).prefault({}),
});

export type Schema = z.output<typeof Schema>;

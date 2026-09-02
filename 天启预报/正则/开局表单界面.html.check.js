
(function(){
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function v(id){var el=document.getElementById(id);return el?el.value.trim():'';}
  function start(){var c=document.querySelector('.tq-cover');if(c)c.style.display='none';var f=document.getElementById('tq-form');if(f)f.style.display='block';}
  async function commit(){
    var msg=document.getElementById('tq-msg');
    var SOURCE_BASE={'不入阶':0,'应激期':20,'发育期':50,'水银':100,'黄金':200,'以太':500,'星锑':800,'贤者之石':1200,'天敌':9999,'阶位未知':0};
    var name=v('f-name')||'{{user}}';
    var gender=v('f-gender')||'男';
    var age=parseInt(v('f-age'))||null;
    var identity=v('f-identity')||'未设定';
    var faction=v('f-faction')||'无';
    var race=v('f-race')||'人类';
    var lineage=(v('f-lineage')==='原创谱系')?(v('f-lineage-custom')||'原创谱系'):(v('f-lineage')||'无谱系');
    var rank=v('f-rank')||'不入阶';
    var seals=(v('f-seal')||'').split(/[,，]/).map(function(s){return s.trim();}).filter(Boolean).map(function(nm){return {名称:nm, 日常:'', 激发:''};});
    var soulName=v('f-soul');
    var soulTier=parseInt(v('f-soul-tier'))||1;
    var soulEffect=v('f-soul-effect');
    var souls=soulName?{[soulName]:{效果:soulEffect,阶位:soulTier}}:{};
    var coag=Math.min(200,Math.max(0,parseInt(v('f-coag'))||0));
    var COAG_LAND={'不入阶':'授名者','应激期':'授名者','发育期':'授名者','水银':'授名者','黄金':'着衣者','以太':'着衣者','星锑':'冠戴者','贤者之石':'统治者','天敌':'地狱之王'};
    var COAG_NEXT={'授名者':['着衣者',120],'着衣者':['冠戴者',140],'冠戴者':['统治者',160],'统治者':['地狱之王',180]};
    var coagLand=COAG_LAND[rank]||'授名者';
    var coagNxt=COAG_NEXT[coagLand];
    var coagNextName=coagNxt?coagNxt[0]:'';
    var coagNextNum=coagNxt?coagNxt[1]:0;
    var professions={};
    (v('f-profession')||'').split(/[；;]/).map(function(s){return s.trim();}).filter(Boolean).forEach(function(item){
      var parts=item.split(/[：:]/).map(function(s){return s.trim();}).filter(Boolean);
      if(parts.length>=2)professions[parts[0]]={等级:parts[1]||'',协会:parts[2]||''};
    });
    function readWeapon(prefix){
      var nm=v(prefix+'-name'); if(!nm)return null;
      var fx=v(prefix+'-fx');
      return {物品ID:prefix,名称:nm,类型:'武器',武器类别:(v(prefix+'-type')||'其他').slice(0,4),阶位:v(prefix+'-rank')||'水银',基础伤害:parseInt(v(prefix+'-dmg'))||0,命中修正:0,破阶标签:(v(prefix+'-break')==='1'?['破阶']:[]),弹药或充能:null,状态:'完好',特殊效果:fx?[fx.slice(0,20)]:[],有效距离:['近距']};
    }
    var mainW=readWeapon('f-wmain'), offW=readWeapon('f-woff');
    var weapons={};
    if(mainW)weapons[mainW.物品ID]=mainW;
    if(offW)weapons[offW.物品ID]=offW;
    function wdesc(w){return w?('「'+esc(w.名称)+'」'+(w.武器类别?'（'+esc(w.武器类别)+'）':'')+' 伤害'+w.基础伤害+' '+esc(w.阶位)+(w.破阶标签.length?'·破阶':'')+(w.特殊效果.length?'·'+esc(w.特殊效果[0]):'')):'';}
    var date=v('f-date')||'2110年前夜';
    var place=v('f-place')||'新海市';
    var publicId=v('f-public'), motive=v('f-motive'), secret=v('f-secret'), appearance=v('f-appearance')||'', clothing=v('f-clothing')||'';
    var relations=v('f-relations');
    var opening=v('f-opening');
    var itemNames=(v('f-items')||'').split(/[,，、]/).map(function(s){return s.trim();}).filter(Boolean);
    var items={};
    itemNames.forEach(function(nm,i){items['item-'+i]={物品ID:'item-'+i,名称:nm,类型:'普通物品',数量:1,说明:''};});
    if(mainW)items[mainW.物品ID]=mainW;
    if(offW)items[offW.物品ID]=offW;
    try{
      var option={type:'message',message_id:getCurrentMessageId()};
      await updateVariablesWith(function(vars){
        _.set(vars,'stat_data.玩家档案.基础',{姓名:name,性别:gender,年龄:age,当前身份:identity,当前势力:faction,种族:race,谱系:lineage,外貌:appearance,圣痕:seals});
        _.set(vars,'stat_data.玩家档案.战力',{基础阶位:rank,当前阶位:rank,爆发态:null,极限态:null});
        _.set(vars,'stat_data.玩家档案.当前源质',SOURCE_BASE[rank]||0);
        _.set(vars,'stat_data.玩家档案.源质上限',SOURCE_BASE[rank]||0);
        _.set(vars,'stat_data.玩家档案.当前服饰',clothing);
        _.set(vars,'stat_data.玩家档案.生理状态','健康');
        _.set(vars,'stat_data.玩家档案.能力',{技能:{},灵魂能力:souls,威权:{},职业:professions});
        _.set(vars,'stat_data.玩家档案.凝固度',coag);
        _.set(vars,'stat_data.物品栏',items);
        _.set(vars,'stat_data.玩家档案.当前武器',mainW||null);
        _.set(vars,'stat_data.玩家档案.副手武器',offW||null);
        _.set(vars,'stat_data.当前时间.日期',date);
        _.set(vars,'stat_data.当前地点.名称',place);
        return vars;
      },option);
      var desc='我是'+esc(name)+'，'+esc(gender)+'，'+(age==null?'年龄不详':esc(age)+'岁')+'，'+esc(identity)+'。';
      desc+='种族：'+esc(race)+'，谱系'+esc(lineage)+'，阶位'+esc(rank)+(seals.length?'，圣痕'+esc(seals.map(function(s){return s.名称;}).join('、')):'')+(soulName?'，灵魂能力'+esc(soulName)+'（'+soulTier+'阶'+(soulEffect?'，效果：'+esc(soulEffect):'')+'）':'')+'。';
      if(appearance)desc+='外貌：'+esc(appearance)+'。';
      if(clothing)desc+='当前服饰：'+esc(clothing)+'。';
      desc+='当前时间：'+esc(date)+'，当前地点：'+esc(place)+'。';
      if(publicId)desc+='公开身份：'+esc(publicId)+'。';
      if(motive)desc+='当前动机：'+esc(motive)+'。';
      if(secret&&secret!=='无')desc+='隐秘：'+esc(secret)+'。';
      if(relations)desc+='开局关系：'+esc(relations)+'。';
      if(itemNames.length)desc+='初始物品：'+esc(itemNames.join('、'))+'。';
      if(mainW||offW)desc+='初始武器：'+(mainW?('主手'+wdesc(mainW)):'')+(offW?('；副手'+wdesc(offW)):'')+'。';
      if(Object.keys(professions).length)desc+='副职：'+esc(Object.keys(professions).map(function(k){return k+(professions[k].等级?'（'+professions[k].等级+'）':'');}).join('、'))+'。';
      if(coag>0)desc+='凝固度：'+coag+'。';
      var initCmd='\n\n【开局初始化·本条为建档指令，请在本轮「变量更新」中执行，正文不得复述】\n'
        +(seals.length
          ?'1. 圣痕已填〔'+esc(seals.map(function(s){return s.名称;}).join('、'))+'〕，请补全每条圣痕的 日常（静默态痕迹）与 激发（催动源质后的异象），replace /玩家档案/基础/圣痕 为完整对象数组。\n'
          :'1. 圣痕：基础.圣痕为空，依谱系「'+esc(lineage)+'」与阶位「'+esc(rank)+'」确定该谱系此阶位的圣痕称谓（圣痕与玩家阶位一一对应、谱系路径隔离，见「圣痕与谱系」：天问之路一阶=礼魂/阴魂、永恒之路一阶=骑士；原文无此路径此阶位圣痕时按路径气质现场生成），insert 到 /玩家档案/基础/圣痕/-（每条含 名称/日常/激发，日常与激发不得留空）。\n')
        +'2. 技能：依该圣痕生成两个技能 insert 到 /玩家档案/能力/技能/——①主动技能（消耗源质、发动负荷>0，可主动发动）＋②被动技能（消耗全为0、发动负荷0，常驻日常效果）；每条含 效果/消耗{源质,生命,修正值,歪曲度，为0不写}/来源=圣痕/发动负荷/每回合维持负荷/使用条件/特殊限制/破阶标签；使用条件、特殊限制、破阶标签是数组。\n'
        +'3. 进阶目标：依「晋升方式」生成下一阶段进阶仪式要求——replace /玩家档案/成长/下一目标 为「进阶{下一阶位}（{谱系}）」；replace /玩家档案/成长/里程碑条件 为 2-3 条字符串数组，每条「类型：一句话试炼要求」（类型取 掌握/实战/代价或稳定性，至少一条掌握、一条实战）。\n'
        +(soulName?'灵魂能力已填〔'+esc(soulName)+'〕，无需补足。':'灵魂能力未填，禁止凭空补足（待完成伟业后觉醒）。')
        +(coag>0?('\n凝固度已填〔'+coag+'〕：replace /玩家档案/凝固度 为 '+coag+'。'):'')
        +(coag>=100?(coagNextNum?('凝固度达100即凝固者：replace /玩家档案/凝固/阶位 为 "'+coagLand+'"; replace /玩家档案/凝固/下一目标 为 "进阶'+coagNextName+'·凝固度'+coagNextNum+'"; replace /玩家档案/凝固/里程碑条件 为 ["凝固度：达到'+coagNextNum+'","掌握：（依角色气质写一句话试炼）","实战：（依角色气质写一句话试炼）"]（第一条固定为凝固度阈值，其余类型取 掌握/实战/代价或稳定性；三项都不得留空）。'):('凝固度达100即凝固者：replace /玩家档案/凝固/阶位 为 "'+coagLand+'"（已是地狱之王，无更高凝固阶位）。')):'')
        +((mainW||offW)?('\n初始武器：'+(mainW?('insert /物品栏/'+mainW.物品ID+' = '+JSON.stringify(mainW)+'，再 replace /玩家档案/当前武器 为该对象；'):'')+(offW?('insert /物品栏/'+offW.物品ID+' = '+JSON.stringify(offW)+'，再 replace /玩家档案/副手武器 为该对象；'):'')):'')
        +(Object.keys(professions).length?('\n副职已填〔'+esc(Object.keys(professions).join('、'))+'〕：' + Object.keys(professions).map(function(k){var d=professions[k]||{};var assoc=d.协会||(k==='厨魔'?'厨魔大赛组委会':(k==='灾厄乐师'?'诸地狱联合音乐协会':(k==='学者'?'象牙之塔':''))); return 'insert /玩家档案/能力/职业/'+k+' = {"等级":"'+esc(d.等级||'')+'","协会":"'+esc(assoc)+'"};';}).join('') + Object.keys(professions).map(function(k){var d=professions[k]||{};var nm=k+(d.等级||''); return ' insert /玩家档案/称号/- = {"称号名":"'+esc(nm)+'","阶位":1,"效果":"'+esc(d.等级?('拥有'+nm+'等级的权利与待遇'):(k+'对应权利与待遇'))+'"};';}).join('') + ' 称号字段固定为 称号名/阶位/效果，禁止写成"名称"。'):'');
      var firstMsg=opening?(opening+'\n\n'+desc+initCmd):(desc+initCmd);
      createChatMessages([{role:'user',name:name,message:firstMsg}]).then(function(){triggerSlash('/trigger');});
      msg.textContent='档案已写入，正在送你进入'+(place||'新海市')+'…';
    }catch(e){msg.textContent='出错：'+e.message;}
  }
  var startBtn=document.getElementById('tq-start-btn');
  if(startBtn)startBtn.addEventListener('click',start);
  var commitBtn=document.getElementById('tq-commit-btn');
  if(commitBtn)commitBtn.addEventListener('click',commit);
  var dateSel=document.getElementById('f-date-sel');
  if(dateSel)dateSel.addEventListener('change',function(){if(this.value)document.getElementById('f-date').value=this.value;});
  var placeSel=document.getElementById('f-place-sel');
  if(placeSel)placeSel.addEventListener('change',function(){if(this.value)document.getElementById('f-place').value=this.value;});
  var lineage=document.getElementById('f-lineage');
  if(lineage)lineage.addEventListener('change',function(){document.getElementById('lineage-custom-label').style.display=this.value==='原创谱系'?'':'none';});
})();


(function(){
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function num(v){return Number(v)||0;}
  function affColor(v){v=num(v);if(v>=50)return'tq-aff-good';if(v>=-50)return'tq-aff-mid';return'tq-aff-bad';}
  function affLabel(v){v=num(v);if(v>=151)return'生死羁绊';if(v>=101)return'亲密';if(v>=51)return'信赖';if(v>=21)return'友善';if(v>=-20)return'中立';if(v>=-50)return'反感';if(v>=-100)return'敌视';if(v>=-150)return'仇恨';return'死敌';}
  function bar(lb,val,max,cls,sfx){
    val=num(val);max=num(max)||100;var pct=Math.min(100,Math.max(0,max>0?val/max*100:0));
    return '<div class="tq-bar"><div class="tq-bar-top"><span class="tq-bar-lb">'+esc(lb)+'</span><span class="tq-bar-num">'+(sfx?val+sfx:val+'/'+max)+'</span></div><div class="tq-bar-tk"><div class="tq-bar-fl '+cls+'" style="width:'+pct+'%"></div></div></div>';
  }
  function sec(title,inner,extra){var cls=(foldedTitles[title]?'tq-sec sec-collapsed':'tq-sec')+(extra?' '+extra:'');return '<div class="'+cls+'"><div class="tq-sec-t" data-sec-title="'+esc(title).replace(/"/g,'&quot;')+'">'+esc(title)+'</div>'+inner+'</div>';}
  function kv(k,v){return '<div class="tq-kv"><span class="tq-k">'+esc(k)+'</span><span class="tq-v">'+esc(v==null||v===''?'—':v)+'</span></div>';}

  var S={};
var foldedTitles={};
var openedNpc={};
  function load(){
    try{
      var option={type:'message',message_id:getCurrentMessageId()};
      S=_.get(getVariables(option),'stat_data',{})||{};
      var chatVars={};
      try{ chatVars=getVariables({type:'chat'}); }catch(e){}
      var chatStat=_.get(chatVars,'stat_data',{})||{};
      S=_.merge({},chatStat,S);
    }catch(e){S={};}
    render();
  }
  if(typeof eventOn==='function'){ try{ eventOn('mag_variable_update_ended_for_zod', function(){ setTimeout(load,50); }); }catch(e){} }

  function render(){
    var p=S.玩家档案||{}, b=p.基础||{}, z=p.战力||{}, hp=p.HP||{}, ld=p.战斗负荷||{}, ab=p.能力||{};
    var w=S.世界||{}, t=S.当前时间||{}, loc=S.当前地点||{}, sy=S.系统||{}, npc=S.NPC档案||{}, gr=p.成长||{};
    var rank=z.当前阶位||'不入阶';
    var skills=ab.技能||{}, souls=ab.灵魂能力||{}, auths=ab.威权||{}, profs=ab.职业||{};
    var titles=p.称号||[];
    var src=num(p.当前源质), srcMax=num(p.源质上限);
    var hdSub=(t.日期||'')+' '+(t.时刻||'')+' · '+(loc.区域&&loc.区域!==''?loc.区域+'·':'')+(loc.名称||'未设定');
    document.getElementById('tq-hd-sub').textContent=hdSub||'载入中…';
    renderOverview(p,b,z,rank,hp,ld,src,srcMax,w);
    renderAbility(skills,souls,auths,titles,profs);
    renderCharacters(npc,sy);
    renderPromotion(b,ab,z,rank,gr,p.凝固,p.凝固度);
    renderBag(p);
  }

  function renderOverview(p,b,z,rank,hp,ld,src,srcMax,w){
    var seals=b.圣痕||[];
    function sealName(s){return typeof s==='string'?s:(s&&s.名称?s.名称:'');}
    var seenSeal={};seals=seals.filter(function(s){var nm=sealName(s);if(!nm||seenSeal[nm])return false;seenSeal[nm]=1;return true;});
    var h='';
    h+=sec('身份档案','<div class="tq-grid tq-desk">'
      +kv('玩家姓名',b.姓名)+kv('性别',b.性别)+kv('年龄',b.年龄==null?'':b.年龄+'岁')+kv('谱系',b.谱系)+kv('圣痕',seals.map(sealName).join('、'))+kv('阶位',rank)
      +'</div>'
      +'<div class="tq-grid tq-mob">'
      +kv('玩家姓名',b.姓名)
      +kv('性别 / 年龄',(b.性别||'未知')+(b.年龄==null?'':'  '+b.年龄+'岁'))
      +kv('谱系 / 圣痕 / 阶位',(b.谱系||'未设定')+'  '+(seals.length?seals.map(sealName).join('、'):'无')+'  '+rank)
      +'</div>'
      +kv('所在地点',(S.当前地点&&S.当前地点.区域?S.当前地点.区域+'':'')+(S.当前地点&&S.当前地点.名称?S.当前地点.名称:'')));
    h+=sec('偏差','<div class="tq-grid">'+kv('修正值',p.修正值)+kv('歪曲度',p.歪曲度)+kv('世界危险度',w.危险度)+'</div>','tq-desk-sec');
    if(seals.length){
      var sh='';
      seals.forEach(function(s){
        var nm=sealName(s);
        var daily=(s&&typeof s==='object'&&s.日常)?s.日常:'';
        var excite=(s&&typeof s==='object'&&s.激发)?s.激发:'';
        if(daily||excite){
          sh+='<div class="tq-item"><div class="tq-item-hd"><span class="tq-item-nm">'+esc(nm)+'</span></div>'
            +(daily?'<div class="tq-item-ef">日常：'+esc(daily)+'</div>':'')
            +(excite?'<div class="tq-item-ef" style="color:#c0a86b">激发：'+esc(excite)+'</div>':'')
            +'</div>';
        }
      });
      if(sh)h+=sec('圣痕形态',sh);
    }
    if(b.外貌)h+=sec('外貌','<div class="tq-desc">'+esc(b.外貌)+'</div>');
    h+=sec('生理数值',
      bar('生命值',hp.当前,hp.上限,'tq-g-hp')
      +bar('战斗负荷',ld.当前,ld.上限,'tq-g-ld')
      +bar('源质',src,srcMax,'tq-g-src')
      +bar('凝固度',p.凝固度,200,'tq-g-coag')
      +kv('凝固阶位',(p.凝固&&p.凝固.阶位&&p.凝固.阶位!=='无')?p.凝固.阶位:'无'));
    h+=sec('实时状态','<div class="tq-grid">'
      +kv('生理状态',p.生理状态)+kv('当前服饰',p.当前服饰)+kv('当前形态',p.当前形态)+kv('当前目标',p.当前目标)
      +'</div>'
      +(Array.isArray(p.当前状态)&&p.当前状态.length?kv('附加状态',p.当前状态.join('、')):''));
    h+=sec('偏差','<div class="tq-grid">'+kv('修正值',p.修正值)+kv('歪曲度',p.歪曲度)+kv('世界危险度',w.危险度)+'</div>','tq-mob-sec');
    document.getElementById('tq-overview').innerHTML=h;
  }

  function renderAbility(skills,souls,auths,titles,profs){
    var h='';
    var skillKeys=Object.keys(skills||{}), soulKeys=Object.keys(souls||{}), authKeys=Object.keys(auths||{}), profKeys=Object.keys(profs||{});
    h+=sec('技能（'+skillKeys.length+'）', skillKeys.length? skillKeys.map(function(k){
      var a=skills[k]||{};
      var cost=a.消耗||{};
      var costParts=[];
      if(num(cost.源质)>0)costParts.push('源质'+cost.源质);
      if(num(cost.生命)>0)costParts.push('生命'+cost.生命);
      if(num(cost.修正值)>0)costParts.push('修正值'+cost.修正值);
      if(num(cost.歪曲度)>0)costParts.push('歪曲度'+cost.歪曲度);
      return '<div class="tq-item"><div class="tq-item-hd"><span class="tq-item-nm">'+esc(k)+'</span><span class="tq-badge" style="background:rgba(123,192,168,.15);color:#7bc0a8">'+(a.来源?esc(a.来源):'')+'</span></div>'+(a.效果?'<div class="tq-item-ef">'+esc(a.效果)+'</div>':'')+(costParts.length?'<div class="tq-item-ef" style="color:#c0a86b">消耗：'+esc(costParts.join('、'))+'</div>':'')+'</div>';
    }).join('') : '<div class="tq-empty">无技能记录</div>');
    h+=sec('灵魂能力（'+soulKeys.length+'）', soulKeys.length? soulKeys.map(function(k){
      var a=souls[k]||{};
      return '<div class="tq-item"><div class="tq-item-hd"><span class="tq-item-nm">'+esc(k)+'</span><span class="tq-badge" style="background:rgba(160,104,192,.15);color:#a068c0">'+(a.阶位?'阶位'+esc(a.阶位):'')+'</span></div>'+(a.效果?'<div class="tq-item-ef">'+esc(a.效果)+'</div>':'')+'</div>';
    }).join('') : '<div class="tq-empty">完成伟业后觉醒</div>');
    h+=sec('威权（'+authKeys.length+'）', authKeys.length? authKeys.map(function(k){
      var a=auths[k]||{};
      return '<div class="tq-item"><div class="tq-item-hd"><span class="tq-item-nm">'+esc(k)+'</span></div>'+(a.效果?'<div class="tq-item-ef">'+esc(a.效果)+'</div>':'')+'</div>';
    }).join('') : '<div class="tq-empty">无威权</div>');
    h+=sec('职业（'+profKeys.length+'）', profKeys.length? profKeys.map(function(k){
      var a=profs[k]||{};
      return '<div class="tq-item"><div class="tq-item-hd"><span class="tq-item-nm">'+esc(k)+'</span><span class="tq-badge" style="background:rgba(107,168,192,.15);color:#6ba8c0">'+esc(a.等级||'')+'</span></div>'+(a.协会?'<div class="tq-item-ef" style="color:#7d8d88">'+esc(a.协会)+'</div>':'')+'</div>';
    }).join('') : '<div class="tq-empty">无副职</div>');
    h+=sec('称号（'+titles.length+'）', titles.length? titles.map(function(t){
      var tn=t.称号名||t.名称||'未命名称号';
      return '<div class="tq-item"><div class="tq-item-hd"><span class="tq-item-nm">【'+esc(tn)+'】</span><span class="tq-badge" style="background:rgba(192,168,107,.15);color:#c0a86b">'+(t.阶位?'阶位'+esc(t.阶位):'')+'</span></div>'+(t.效果?'<div class="tq-item-ef">'+esc(t.效果)+'</div>':'')+'</div>';
    }).join('') : '<div class="tq-empty">完成挑战性事件获得称号</div>');
    document.getElementById('tq-ability').innerHTML=h;
  }

  function npcDetail(c){
    var short=[]; var long=[];
    function addShort(k,v){ if(v!==''&&v!=null&&v!=='未知'&&v!=='无') short.push({k:k,v:v}); }
    function addLong(k,v){ if(v!==''&&v!=null&&v!=='未知'&&v!=='无') long.push('<div class="tq-npc-d-line"><b>'+k+'</b>'+esc(v)+'</div>'); }
    addShort('性别', c.性别);
    if(c.年龄!=null) addShort('年龄', c.年龄+'岁');
    addShort('种族', c.种族);
    addShort('谱系', c.谱系);
    addShort('势力', c.当前势力);
    addShort('位置', c.当前位置);
    addShort('情绪', c.当前情绪);
    var hp=c.HP, ld=c.战斗负荷;
    if(hp&&hp.当前!=null) addShort('生命', hp.当前+'/'+(hp.上限||100));
    if(ld&&ld.当前!=null) addShort('战斗负荷', ld.当前+'/'+(ld.上限||100));
    addShort('与主角关系', c.与主角关系);
    addShort('好感度', c.好感度);
    addLong('身份', c.当前身份);
    addLong('简介', c.外观);
    addLong('行动', c.当前行动);
    if(c.随身物品){ var names=Object.keys(c.随身物品).map(function(id){var it=c.随身物品[id]||{};return it.名称||id;}); if(names.length) addLong('随身物品', names.join('、')); }
    if(c.当前武器&&c.当前武器.名称) addLong('当前武器', c.当前武器.名称);
    var grid=short.length?'<div class="tq-npc-d-grid">'+short.map(function(s){return '<div class="tq-npc-d-cell"><b>'+s.k+'</b>'+esc(s.v)+'</div>';}).join('')+'</div>':'';
    return '<div class="tq-npc-detail">'+grid+long.join('')+'</div>';
  }
  function renderCharacters(npc,sy){
    var h='';
    var present=npc.在场角色||{}, absent=npc.不在场角色||{};
    var pn=Object.keys(present), an=Object.keys(absent);
    h+=sec('在场人物（'+pn.length+'）', pn.length? pn.map(function(k){
      var c=present[k]||{};
      var af=num(c.好感度);
      return '<div class="tq-npc'+(openedNpc[k]?' open':'')+'" data-npc="'+esc(k)+'"><div class="tq-npc-av">'+esc((k||'?').slice(0,1))+'</div><div class="tq-npc-info"><div class="tq-npc-nm">'+esc(k)+'</div><div class="tq-npc-sub">'+esc(c.阶位||'')+(c.与主角距离?'  '+esc(c.与主角距离):'')+(c.当前情绪&&c.当前情绪!=='平静'?'  '+esc(c.当前情绪):'')+(c.恋人?'  <span class="tq-chip" style="background:rgba(224,107,160,.18);color:#e08bb0">恋人</span>':'')+(c.当前心声?'<div class="tq-npc-voice">'+esc(c.当前心声)+'</div>':'')+'</div>'+npcDetail(c)+'</div><div class="tq-aff '+affColor(af)+'">'+affLabel(af)+' '+af+'</div></div>';
    }).join('') : '<div class="tq-empty">周围无角色</div>');
    if(an.length)h+=sec('不在场人物（'+an.length+'）', an.map(function(k){return '<span class="tq-chip" style="background:rgba(0,0,0,.25);color:#7d8d88">'+esc(k)+'</span>';}).join(''));
    if(sy.已完成事件)h+=sec('已完成事件','<div class="tq-desc">'+esc(sy.已完成事件)+'</div>');
    document.getElementById('tq-characters').innerHTML=h;
  }

  function renderPromotion(b,ab,z,rank,gr,coag,coagVal){
    var sealNames=b.圣痕||[];
    function sealName(s){return typeof s==='string'?s:(s&&s.名称?s.名称:'');}
    var next=gr.下一目标||'';
    var ms=gr.里程碑条件||[];
    function isDone(m){return typeof m==='string'?/已完成/.test(m):(m&&m.状态==='已完成');}
    function condText(m){return typeof m==='string'?m:(m&&m.条件?m.条件:'');}
    function typeText(m){return (m&&typeof m==='object'&&m.类型)?m.类型:'';}
    var done=ms.length>0 && ms.every(isDone);
    var coagRank=(coag&&coag.阶位)?coag.阶位:'无';
    var coagNext=(coag&&coag.下一目标)?coag.下一目标:'';
    var coagTargetName=coagNext?coagNext.replace(/^进阶/,'').split('·')[0].trim():'';
    var coagMs=(coag&&coag.里程碑条件)||[];
    var coagDone=coagTargetName!=='' && coagMs.length>0 && coagMs.every(function(m){return typeof m==='string'?/已完成/.test(m):(m&&m.状态==='已完成');});
    var isCoag=num(coagVal)>=100;
    var h='';
    h+=sec('当前','<div class="tq-grid">'+kv('谱系 / 圣痕 / 阶位',(b.谱系||'未设定')+'  '+(sealNames.map(sealName).join('、')||'无')+'  '+rank)+kv('凝固度',num(coagVal))+(isCoag?kv('凝固阶位',coagRank):'')+'</div>');
    if(isCoag){
      h+=sec('凝固晋升目标','<div class="tq-kv"><span class="tq-k">下一凝固阶位</span><span class="tq-v">'+esc(coagNext||'等待变量写入（点↻刷新或重roll）')+'</span></div>');
      if(coagMs.length){
        var cmh='';
        coagMs.forEach(function(m,i){
          var done1=typeof m==='string'?/已完成/.test(m):(m&&m.状态==='已完成');
          var cond=typeof m==='string'?m:(m&&m.条件?m.条件:'');
          cmh+='<div class="tq-item"><div class="tq-item-hd"><span class="tq-item-nm">'+esc('里程碑'+(i+1)+'：'+cond)+'</span><span class="tq-badge" style="background:'+(done1?'rgba(123,192,168,.15)':'rgba(224,107,107,.15)')+';color:'+(done1?'#7bc0a8':'#e06b6b')+'">'+(done1?'已完成':'未完成')+'</span></div></div>';
        });
        h+=sec('凝固晋升条件',cmh);
      }
      h+='<button class="tq-btn" id="tq-coag-btn" type="button" '+(coagTargetName&&coagDone?'':'disabled')+' style="background:linear-gradient(135deg,#6b2f2f,#c06b6b)">'+(coagTargetName&&coagDone?'进行凝固晋升仪式':(coagTargetName?'凝固晋升条件未达成':'凝固晋升目标未生成，无法进行仪式'))+'</button>';
    }else{
      h+=sec('升华晋升目标','<div class="tq-kv"><span class="tq-k">下一目标</span><span class="tq-v">'+esc(next||'—')+'</span></div>');
      if(ms.length){
        var mh='';
        ms.forEach(function(m){
          var done1=isDone(m);
          var cond=condText(m);
          var tp=typeText(m);
          mh+='<div class="tq-item"><div class="tq-item-hd"><span class="tq-item-nm">'+esc(cond)+'</span><span class="tq-badge" style="background:'+(done1?'rgba(123,192,168,.15)':'rgba(224,107,107,.15)')+';color:'+(done1?'#7bc0a8':'#e06b6b')+'">'+(done1?'已完成':'未完成')+'</span></div>'+(tp?'<div class="tq-item-ef" style="color:#7d8d88">'+esc(tp)+'</div>':'')+'</div>';
        });
        h+=sec('升华晋升条件',mh);
      }
      h+='<button class="tq-btn" id="tq-promote-btn" type="button" '+(done?'':'disabled')+'>'+(done?'进行升华晋升仪式':'升华晋升条件未达成')+'</button>';
    }
    document.getElementById('tq-promotion').innerHTML=h;
    var btn=document.getElementById('tq-promote-btn');
    if(btn&&done){
      btn.addEventListener('click',function(){
        sendToInput('真实不虚，确然无误。其上如其下，其下如其上，以此成就太一之奇迹。——升阶 · '+next);
      });
    }
    var cbtn=document.getElementById('tq-coag-btn');
    if(cbtn){
      cbtn.addEventListener('click',function(){
        if(!coagTargetName)return;
        sendToInput('入此门者，当弃绝一切希望。——升阶 · '+coagTargetName);
      });
    }
  }

  function bagBtn(act, attr, val, label){
    return '<button class="tq-btn" type="button" style="display:inline-block;width:auto;padding:5px 12px;font-size:12px;margin:6px 6px 0 0" data-bag-act="'+act+'" '+attr+'="'+esc(val)+'">'+label+'</button>';
  }
  function weaponMeta(w){
    var parts=[];
    parts.push('攻击力 '+(w.基础伤害||1));
    parts.push(esc(w.阶位||'不入阶'));
    if(w.武器类别)parts.push(esc(w.武器类别));
    if(w.破阶标签&&w.破阶标签.length)parts.push('破阶');
    return parts.join(' · ');
  }
  function weaponFx(w){return (w.特殊效果&&w.特殊效果.length)?esc(w.特殊效果.join('；')):'';}
  function weaponSlot(w, slot, slotLabel){
    if(!(w&&w.名称))return '<div class="tq-empty">'+slotLabel+'未装备</div>';
    var meta=weaponMeta(w), fx=weaponFx(w);
    return '<div class="tq-item"><div class="tq-item-hd"><span class="tq-item-nm">'+esc(w.名称)+'</span><span class="tq-badge" style="background:rgba(123,192,168,.15);color:#7bc0a8">'+esc(slotLabel)+'</span></div>'+(meta?'<div class="tq-item-ef">'+meta+'</div>':'')+(fx?'<div class="tq-item-ef" style="color:#c0a86b">'+fx+'</div>':'')+bagBtn('unequip','data-slot',slot,'卸下')+bagBtn('deleteSlot','data-slot',slot,'删除')+'</div>';
  }
  function renderBag(p){
    var h='';
    var curW=p.当前武器, offW=p.副手武器;
    var items=_.assign({}, S.物品栏||{}, p.武器||{});
    h+=sec('已装备（主手·副手，最多两把）', weaponSlot(curW,'当前武器','主手')+weaponSlot(offW,'副手武器','副手'));
    var ik=Object.keys(items);
    if(ik.length)h+=sec('物品栏（'+ik.length+'）', ik.map(function(k){
      var it=items[k]||{};
      var ittype=(it.类型==='普通武器'||it.类型==='源质武装')?'武器':it.类型;
      var isWeapon=(ittype==='武器');
      var sub='';
      if(isWeapon){ sub=weaponMeta(it)+(weaponFx(it)?(' · '+weaponFx(it)):''); }
      else{
        var parts=[];
        if(num(it.数量)>1)parts.push('×'+it.数量);
        if(it.说明)parts.push(esc(it.说明));
        sub=parts.join(' · ');
      }
      return '<div class="tq-item"><div class="tq-item-hd"><span class="tq-item-nm">'+esc(it.名称||k)+'</span><span class="tq-badge" style="background:rgba(123,192,168,.15);color:#7bc0a8">'+esc(ittype||(isWeapon?'武器':'普通物品'))+'</span></div>'+(isWeapon?bagBtn('equip','data-item',k,'装备'):'')+bagBtn('delete','data-item',k,'删除')+(sub?'<div class="tq-item-ef">'+sub+'</div>':'')+'</div>';
    }).join(''));
    if(!ik.length&&!(curW&&curW.名称)&&!(offW&&offW.名称))h='<div class="tq-empty">背包为空</div>';
    document.getElementById('tq-bag').innerHTML=h;
    bindBagButtons();
  }

  function bindBagButtons(){
    var bag=document.getElementById('tq-bag');
    if(!bag)return;
    var btns=bag.querySelectorAll('[data-bag-act]');
    for(var i=0;i<btns.length;i++){
      (function(btn){
        btn.addEventListener('click',function(){
          var act=btn.getAttribute('data-bag-act');
          if(act==='equip')equipWeapon(btn.getAttribute('data-item'));
          else if(act==='unequip')unequipWeapon(btn.getAttribute('data-slot'));
          else if(act==='delete')deleteItem(btn.getAttribute('data-item'));
          else if(act==='deleteSlot')deleteSlot(btn.getAttribute('data-slot'));
        });
      })(btns[i]);
    }
  }

  function equipWeapon(itemKey){
    var option={type:'message',message_id:getCurrentMessageId()};
    updateVariablesWith(function(vars){
      var items=_.get(vars,'stat_data.物品栏',{})||{};
      var w=items[itemKey];
      if(!(w&&w.名称))return vars;
      var main=_.get(vars,'stat_data.玩家档案.当前武器',null);
      var off=_.get(vars,'stat_data.玩家档案.副手武器',null);
      if(!(main&&main.名称)){ _.set(vars,'stat_data.玩家档案.当前武器',w); }
      else if(!(off&&off.名称)){ _.set(vars,'stat_data.玩家档案.副手武器',w); }
      else{ return vars; }
      delete items[itemKey];
      _.set(vars,'stat_data.物品栏',items);
      return vars;
    },option);
  }

  function unequipWeapon(slot){
    var option={type:'message',message_id:getCurrentMessageId()};
    updateVariablesWith(function(vars){
      var w=_.get(vars,'stat_data.玩家档案.'+slot,null);
      if(!(w&&w.名称))return vars;
      var items=_.get(vars,'stat_data.物品栏',{})||{};
      items[w.物品ID||('武器'+Date.now())]=w;
      _.set(vars,'stat_data.物品栏',items);
      _.set(vars,'stat_data.玩家档案.'+slot,null);
      return vars;
    },option);
  }

  function deleteItem(itemKey){
    var option={type:'message',message_id:getCurrentMessageId()};
    updateVariablesWith(function(vars){
      var items=_.get(vars,'stat_data.物品栏',{})||{};
      delete items[itemKey];
      _.set(vars,'stat_data.物品栏',items);
      var oldW=_.get(vars,'stat_data.玩家档案.武器',{})||{};
      if(oldW[itemKey]){ delete oldW[itemKey]; _.set(vars,'stat_data.玩家档案.武器',oldW); }
      return vars;
    },option);
  }

  function deleteSlot(slot){
    var option={type:'message',message_id:getCurrentMessageId()};
    updateVariablesWith(function(vars){
      var w=_.get(vars,'stat_data.玩家档案.'+slot,null);
      _.set(vars,'stat_data.玩家档案.'+slot,null);
      if(w&&w.物品ID){
        var oldW=_.get(vars,'stat_data.玩家档案.武器',{})||{};
        if(oldW[w.物品ID]){ delete oldW[w.物品ID]; _.set(vars,'stat_data.玩家档案.武器',oldW); }
      }
      return vars;
    },option);
  }

  function sendToInput(text){
    var ta=null;
    try{ta=document.getElementById('send_textarea');}catch(e){}
    if(!ta){try{ta=window.parent.document.getElementById('send_textarea');}catch(e){}}
    if(!ta){try{ta=window.top.document.getElementById('send_textarea');}catch(e){}}
    if(ta){ta.value=text;ta.dispatchEvent(new Event('input',{bubbles:true}));ta.focus();}
  }

  // 折叠 / 展开
  var hd=document.getElementById('tq-hd');
  if(hd)hd.addEventListener('click',function(){
    var st=document.querySelector('.tq-status');
    if(st)st.classList.toggle('collapsed');
  });

  // tab 切换
  document.querySelectorAll('.tq-tab').forEach(function(tab){
    tab.addEventListener('click',function(){
      document.querySelectorAll('.tq-tab').forEach(function(t){t.classList.remove('active');});
      document.querySelectorAll('.tq-pane').forEach(function(p){p.classList.remove('active');});
      tab.classList.add('active');
      document.getElementById('tq-'+tab.dataset.tab).classList.add('active');
    });
  });

  // 初始化：等 MVU 就绪后读数据，并每 2 秒刷新
  var init=async function(){
    try{ await Promise.race([waitGlobalInitialized('Mvu'), new Promise(function(r){setTimeout(r,3000);})]); }catch(e){}
    load();
    setInterval(load,1500);
  };
  init();
  var rf=document.getElementById('tq-refresh');
  if(rf)rf.addEventListener('click',function(){ load(); });
})();

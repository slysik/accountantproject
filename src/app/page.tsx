'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    // Alladin chat
    const chatMessages = document.getElementById('chatMessages');
    const chatBox = document.getElementById('chatBox');
    if (!chatMessages || !chatBox) return () => clearInterval(interval);
    const convo = [
      {role:'me',  text:"How much did we spend on travel in Q1?"},
      {role:'typ', text:""},
      {role:'bot', text:"<b>$4,218.72</b> across 14 transactions in Q1 — mostly Delta Air Lines ($2,811) and Uber ($784). That's up 18% from Q4 last year."},
      {role:'me',  text:"Any charges that look unusual?"},
      {role:'typ', text:""},
      {role:'bot', text:"Two flagged: a <b>duplicate $54.99 Adobe charge</b> on Mar 15, and a <b>$2,100 hotel</b> in Phoenix that's 4× your typical lodging."},
      {role:'me',  text:"Export everything as QBO for March."},
      {role:'typ', text:""},
      {role:'bot', text:"Done. <b>march_2026.qbo</b> is ready — 89 debit entries, IRS Schedule C categorized, QuickBooks-compatible."},
    ];
    function addBubble(role: string, text: string) {
      const b = document.createElement('div');
      if (role === 'typ') { b.className = 'bubble bot typing'; b.innerHTML = '<i></i><i></i><i></i>'; }
      else { b.className = 'bubble ' + (role === 'me' ? 'me' : 'bot'); b.innerHTML = text; }
      chatMessages!.appendChild(b);
      while (chatMessages!.children.length > 5) chatMessages!.removeChild(chatMessages!.firstChild!);
    }
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    let chatRunning = false;
    async function runChat() {
      if (chatRunning) return;
      chatRunning = true;
      while (true) {
        for (const step of convo) {
          if (step.role === 'typ') {
            addBubble('typ', '');
            await sleep(1300);
            chatMessages!.removeChild(chatMessages!.lastChild!);
          } else {
            addBubble(step.role, step.text);
            await sleep(step.role === 'me' ? 1100 : 2400);
          }
        }
        await sleep(1500);
        chatMessages!.innerHTML = '';
      }
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { runChat(); io.disconnect(); } });
    }, { threshold: .2 });
    io.observe(chatBox);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        :root{--cream:#faf9f7;--cream-2:#f5f0ea;--border:#e8e4df;--border-2:#d5c9bb;--coffee:#1a1208;--coffee-2:#2d2010;--ink:#4a3b28;--mud:#7a6a55;--mud-2:#9a8570;--orange:#d97706;--orange-dark:#b45309;--orange-10:rgba(217,119,6,.10);--orange-20:rgba(217,119,6,.20);--gold:#c4a97d;--green:#16a34a;--red:#dc2626;--font:"Trebuchet MS","Segoe UI","Avenir Next",Helvetica,Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
        *{box-sizing:border-box}
        html,body{margin:0;padding:0}
        body{font-family:var(--font);background:var(--cream);color:var(--coffee);-webkit-font-smoothing:antialiased;font-size:16px;line-height:1.5;overflow-x:hidden}
        a{color:inherit;text-decoration:none}
        button{font-family:inherit;cursor:pointer;border:none;background:none}
        ::selection{background:var(--orange-20);color:var(--coffee)}
        .wrap{max-width:1240px;margin:0 auto;padding:0 28px}
        .wrap-sm{max-width:960px;margin:0 auto;padding:0 28px}
        .eyebrow{font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--mud-2)}
        .eyebrow.orange{color:var(--orange)}
        .btn{display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border-radius:14px;font-weight:700;font-size:15px;transition:transform .15s ease,background .15s ease,box-shadow .15s ease;line-height:1}
        .btn:hover{transform:translateY(-1px)}
        .btn-dark{background:var(--coffee);color:#fff;box-shadow:0 10px 28px -10px rgba(26,18,8,.55)}
        .btn-dark:hover{background:var(--coffee-2)}
        .btn-orange{background:var(--orange);color:#fff;box-shadow:0 10px 28px -10px rgba(217,119,6,.65)}
        .btn-orange:hover{background:var(--orange-dark)}
        .btn-ghost{border:1px solid var(--border-2);background:#fff;color:var(--ink)}
        .btn-ghost:hover{background:var(--cream-2)}
        .arrow{width:14px;height:14px}
        header.nav{position:sticky;top:0;z-index:40;backdrop-filter:blur(14px);background:rgba(250,249,247,.85);border-bottom:1px solid var(--border)}
        .nav-row{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;max-width:1240px;margin:0 auto}
        .brand{display:flex;align-items:center;gap:0;text-decoration:none}
        .brand-logo{display:block;height:80px;width:80px;object-fit:contain}
        .nav-links{display:flex;align-items:center;gap:28px}
        .nav-links a{color:var(--mud);font-size:14px}
        .nav-links a:hover{color:var(--coffee)}
        .nav-cta{background:var(--orange);color:#fff;padding:10px 18px;border-radius:12px;font-weight:700;font-size:13px}
        .nav-cta:hover{background:var(--orange-dark)}
        .hero-text{text-align:center;padding:72px 28px 64px;background:var(--cream)}
        .hero-video-wrap{width:100%;line-height:0}
        .hero-video{display:block;width:100%;height:auto;max-height:88vh;object-fit:cover}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.75)}}
        h1.hero-title{font-size:clamp(42px,6.5vw,88px);font-weight:800;line-height:1.02;letter-spacing:-.035em;margin:0 0 18px;color:var(--coffee)}
        .hero-sub{font-size:19px;color:var(--mud);max-width:560px;margin:0 auto 32px;line-height:1.55}
        .hero-ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
        .hero-trust{display:flex;flex-wrap:wrap;gap:18px 24px;margin-top:24px;font-size:12px;color:var(--mud-2);justify-content:center}
        .hero-trust span{display:inline-flex;align-items:center;gap:8px}
        .hero-trust .tick{color:var(--orange);font-weight:800}
        .demo-stack{position:relative;perspective:1400px}
        .demo-card{background:#fff;border:1px solid var(--border);border-radius:20px;box-shadow:0 40px 80px -30px rgba(26,18,8,.25),0 10px 30px -10px rgba(26,18,8,.12);overflow:hidden}
        .demo-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);background:var(--cream)}
        .demo-dots{display:flex;gap:6px}
        .demo-dots i{display:block;width:10px;height:10px;border-radius:50%;background:#e7d8c6}
        .demo-dots i:first-child{background:#e9a27a}
        .demo-dots i:nth-child(2){background:#e0c07a}
        .demo-dots i:nth-child(3){background:#b9c58c}
        .demo-url{font-family:var(--mono);font-size:11px;color:var(--mud-2);letter-spacing:.02em}
        .demo-body{padding:18px 20px 22px}
        .demo-kicker{font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--mud-2);margin-bottom:10px}
        .demo-title{font-size:15px;font-weight:800;color:var(--coffee)}
        .demo-title em{font-style:normal;color:var(--orange)}
        .demo-sub{font-size:12px;color:var(--mud);margin-top:2px}
        .demo-rows{margin-top:16px;display:flex;flex-direction:column;gap:8px}
        .row{display:grid;grid-template-columns:74px 1fr auto auto;gap:14px;align-items:center;padding:12px 14px;border-radius:12px;border:1px solid var(--border);background:#fff;font-size:13px;transition:background .25s ease,border-color .25s ease}
        .row .date{font-family:var(--mono);color:var(--mud-2);font-size:11.5px}
        .row .desc{font-weight:600;color:var(--coffee);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .row .amt{font-family:var(--mono);font-weight:700;color:var(--coffee)}
        .pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#f2ede6;color:var(--mud);transition:all .3s ease}
        .pill.flagged{background:#fff6e6;color:#8a5a10;animation:flashFlag 1s infinite}
        @keyframes flashFlag{50%{background:#ffd27a;color:#5a3a00}}
        .pill.assigned{background:var(--orange-10);color:var(--orange)}
        .row.new{background:#fff6ec;border-color:#f3d9b8;animation:slideIn .5s both}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .demo-foot{margin-top:14px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--mud-2)}
        .demo-foot .count b{color:var(--orange);font-weight:800}
        .demo-foot .ai{display:inline-flex;align-items:center;gap:6px}
        .demo-foot .ai .bolt{color:var(--orange)}
        .float-badge{position:absolute;background:#fff;border:1px solid var(--border);border-radius:14px;padding:10px 12px;box-shadow:0 20px 40px -20px rgba(26,18,8,.25);font-size:12px;font-weight:700;color:var(--coffee);display:flex;align-items:center;gap:8px;animation:bob 5s ease-in-out infinite}
        .float-badge .bullet{width:8px;height:8px;border-radius:50%;background:var(--green)}
        .float-badge.two .bullet{background:var(--orange)}
        .float-badge .muted{color:var(--mud-2);font-weight:500;font-size:11px}
        .fb-1{top:-18px;left:-20px;animation-delay:.2s}
        .fb-2{bottom:-22px;right:-10px;animation-delay:1.1s}
        @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .marquee-wrap{border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:#fff;overflow:hidden;position:relative;padding:22px 0;margin-top:60px}
        .marquee-wrap::before,.marquee-wrap::after{content:"";position:absolute;top:0;bottom:0;width:120px;z-index:2;pointer-events:none}
        .marquee-wrap::before{left:0;background:linear-gradient(to right,#fff,rgba(255,255,255,0))}
        .marquee-wrap::after{right:0;background:linear-gradient(to left,#fff,rgba(255,255,255,0))}
        .marquee-label{text-align:center;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--mud-2);margin-bottom:14px;font-weight:700}
        .marquee{display:flex;gap:56px;animation:slide 38s linear infinite;width:max-content}
        .marquee span{font-family:"Georgia","Times New Roman",serif;font-size:22px;font-weight:700;color:var(--coffee);opacity:.55;letter-spacing:-.01em;white-space:nowrap;display:inline-flex;align-items:center;gap:10px}
        .marquee span i{width:10px;height:10px;background:var(--orange);display:inline-block;border-radius:2px;transform:rotate(45deg);opacity:.8}
        @keyframes slide{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        section.band{padding:100px 0;border-bottom:1px solid var(--border)}
        section.band.white{background:#fff}
        section.band h2{font-size:clamp(30px,3.6vw,50px);font-weight:800;letter-spacing:-.025em;line-height:1.05;color:var(--coffee);margin:14px 0 0}
        section.band h2 em{font-style:normal;color:var(--orange)}
        .section-head{text-align:center;max-width:720px;margin:0 auto 56px}
        .section-head p.sub{font-size:17px;color:var(--mud);margin-top:14px;line-height:1.55}
        .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
        @media(max-width:960px){.steps{grid-template-columns:repeat(2,1fr)}}
        .step{position:relative;background:#fff;border:1px solid var(--border);border-radius:22px;padding:28px 24px 26px;overflow:hidden;transition:transform .3s ease,box-shadow .3s ease,border-color .3s ease}
        .step:hover{transform:translateY(-4px);box-shadow:0 30px 60px -30px rgba(26,18,8,.2);border-color:#e3d8c7}
        .step .num{font-size:88px;font-weight:900;color:var(--cream-2);line-height:1;letter-spacing:-.05em;position:absolute;top:6px;right:14px}
        .step .ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:var(--orange-10);color:var(--orange);margin-bottom:16px;position:relative;z-index:1}
        .step h3{margin:0 0 8px;font-size:18px;font-weight:800;color:var(--coffee);letter-spacing:-.01em;position:relative;z-index:1}
        .step p{margin:0;font-size:13.5px;color:var(--mud);line-height:1.55;position:relative;z-index:1}
        .feature-row{display:grid;grid-template-columns:1fr 1.1fr;gap:70px;align-items:center;padding:30px 0}
        @media(max-width:960px){.feature-row{grid-template-columns:1fr;gap:30px}.feature-row.flip .vis{order:2}}
        .feature-row.flip{grid-template-columns:1.1fr 1fr}
        .feature-row.flip .copy{order:2}
        .feature-row.flip .vis{order:1}
        .feature-row+.feature-row{margin-top:60px;border-top:1px dashed var(--border)}
        .copy .eyebrow{margin-bottom:14px;display:inline-block}
        .copy h3{font-size:clamp(26px,3vw,40px);font-weight:800;letter-spacing:-.02em;color:var(--coffee);margin:0 0 16px;line-height:1.08}
        .copy p{color:var(--mud);font-size:16px;max-width:500px;line-height:1.6}
        .copy ul{list-style:none;padding:0;margin:18px 0 0;display:flex;flex-direction:column;gap:10px}
        .copy li{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;color:var(--ink)}
        .copy li svg{flex-shrink:0;margin-top:2px;color:var(--orange)}
        .vis-csv{background:linear-gradient(180deg,#fff,#faf6f0);border:1px solid var(--border);border-radius:20px;padding:20px;box-shadow:0 30px 60px -30px rgba(26,18,8,.2)}
        .vis-csv .lanes{display:grid;grid-template-columns:1fr 36px 1fr;gap:18px;align-items:center}
        .lane{background:#fff;border:1px solid var(--border);border-radius:14px;padding:14px 12px;min-height:260px}
        .lane .ltitle{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--mud-2);letter-spacing:.14em;text-transform:uppercase;font-weight:700;margin-bottom:12px}
        .lane .ltitle b{color:var(--coffee);font-family:var(--mono);font-weight:600;letter-spacing:0;text-transform:none;font-size:12px}
        .csv-line{font-family:var(--mono);font-size:11.5px;color:var(--mud);padding:6px 8px;border-bottom:1px dashed var(--border);display:flex;gap:8px;overflow:hidden;white-space:nowrap}
        .csv-line b{color:var(--coffee);font-weight:600}
        .cat-chip{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:10px;margin-bottom:8px;background:#fff6ec;border:1px solid #f3d9b8;font-size:12px}
        .cat-chip .who{color:var(--coffee);font-weight:600}
        .cat-chip .cat{color:var(--orange);font-weight:700;font-family:var(--mono);font-size:11px}
        .arrow-pill{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:var(--coffee);color:var(--orange);font-weight:900;justify-self:center}
        .chat{background:#fff;border:1px solid var(--border);border-radius:20px;padding:18px;box-shadow:0 30px 60px -30px rgba(26,18,8,.2);display:flex;flex-direction:column;gap:10px;max-width:520px}
        .chat-head{display:flex;align-items:center;gap:10px;padding:4px 4px 10px;border-bottom:1px solid var(--border)}
        .chat-avatar{width:34px;height:34px;border-radius:10px;background:var(--coffee);color:var(--orange);display:grid;place-items:center;font-weight:900;font-size:14px}
        .chat-head h4{margin:0;font-size:14px;font-weight:800;color:var(--coffee)}
        .chat-head h4 em{font-style:normal;color:var(--orange)}
        .chat-head p{margin:0;font-size:11px;color:var(--mud-2)}
        .bubble{max-width:86%;padding:10px 14px;border-radius:14px;font-size:13.5px;line-height:1.5}
        .bubble.me{align-self:flex-end;background:var(--coffee);color:#fff;border-bottom-right-radius:4px}
        .bubble.bot{align-self:flex-start;background:var(--cream);border:1px solid var(--border);color:var(--coffee);border-bottom-left-radius:4px}
        .bubble.bot b{color:var(--orange)}
        .bubble.typing{display:flex;gap:4px;align-items:center;padding:12px 14px}
        .bubble.typing i{width:6px;height:6px;border-radius:50%;background:var(--mud-2);animation:typing 1.1s infinite}
        .bubble.typing i:nth-child(2){animation-delay:.15s}
        .bubble.typing i:nth-child(3){animation-delay:.3s}
        @keyframes typing{0%,100%{opacity:.2;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}
        .chat-input{margin-top:4px;display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:var(--cream);font-size:13px;color:var(--mud-2)}
        .chat-input .caret{width:2px;height:14px;background:var(--orange);animation:blink 1s steps(2) infinite}
        @keyframes blink{50%{opacity:0}}
        .vault{background:linear-gradient(135deg,var(--coffee),#2a1d0e);border-radius:22px;padding:28px;color:#fff;box-shadow:0 30px 60px -30px rgba(26,18,8,.5);display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .vault .vitem{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px}
        .vault .vitem .vic{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;background:var(--orange-10);color:var(--orange);margin-bottom:10px}
        .vault .vitem h5{margin:0;color:#fff;font-size:13px;font-weight:800}
        .vault .vitem p{margin:4px 0 0;color:var(--gold);font-size:11.5px;line-height:1.5}
        .vault .big{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;background:rgba(217,119,6,.1);border:1px solid rgba(217,119,6,.3);border-radius:14px}
        .vault .big b{color:#fff;font-size:15px}
        .vault .big span{font-size:11px;color:var(--gold);letter-spacing:.18em;text-transform:uppercase;font-weight:700}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:30px;text-align:center}
        @media(max-width:760px){.stats{grid-template-columns:repeat(2,1fr)}}
        .stat .n{font-size:clamp(40px,4.8vw,64px);font-weight:900;color:var(--orange);letter-spacing:-.03em;line-height:1}
        .stat .l{margin-top:8px;font-size:13px;color:var(--mud);letter-spacing:.02em}
        .cat-cloud{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:900px;margin:0 auto}
        .cat-cloud span{padding:10px 16px;border-radius:999px;background:#fff;border:1px solid var(--border);font-size:13.5px;color:var(--ink);font-weight:600;transition:all .2s ease;cursor:default}
        .cat-cloud span:hover{background:var(--orange);color:#fff;border-color:var(--orange);transform:translateY(-2px)}
        .cat-cloud span.featured{background:var(--coffee);color:#fff;border-color:var(--coffee)}
        .cat-cloud span.featured:hover{background:var(--orange);border-color:var(--orange)}
        .caps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
        @media(max-width:900px){.caps{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:620px){.caps{grid-template-columns:1fr}}
        .cap{background:#fff;border:1px solid var(--border);border-radius:18px;padding:26px 22px;transition:all .25s ease}
        .cap:hover{transform:translateY(-3px);box-shadow:0 28px 50px -30px rgba(26,18,8,.22);border-color:#e3d8c7}
        .cap .ic{width:42px;height:42px;border-radius:11px;background:var(--orange-10);color:var(--orange);display:grid;place-items:center;margin-bottom:14px}
        .cap h4{margin:0 0 6px;font-size:16px;font-weight:800;color:var(--coffee)}
        .cap p{margin:0;font-size:13.5px;color:var(--mud);line-height:1.55}
        .plans{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        @media(max-width:1000px){.plans{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:560px){.plans{grid-template-columns:1fr}}
        .plan{border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:14px;position:relative;transition:all .25s ease;border:1.5px solid transparent}
        .plan:hover{transform:translateY(-3px);box-shadow:0 30px 60px -30px rgba(26,18,8,.18)}
        .plan-mint{background:#edfaf4;border-color:#b6ead0}
        .plan-peach{background:#fff4ed;border-color:#f5cba7}
        .plan-lavender{background:#f3f0ff;border-color:#ccc0f5}
        .plan-sky{background:#edf5ff;border-color:#a8cdfa}
        .plan .tag{position:absolute;top:-12px;right:18px;background:var(--orange);color:#fff;font-size:10px;letter-spacing:.18em;text-transform:uppercase;padding:5px 10px;border-radius:999px;font-weight:800}
        .plan h4{font-size:15px;margin:0;color:var(--coffee);font-weight:800;letter-spacing:.02em;text-transform:uppercase}
        .plan .price{font-size:40px;font-weight:900;color:var(--coffee);letter-spacing:-.03em;line-height:1}
        .plan .price b{color:var(--orange);font-weight:900}
        .plan .price span{font-size:13px;color:var(--mud);font-weight:500;letter-spacing:0}
        .plan .fees{font-size:12px;color:var(--mud)}
        .plan ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;flex:1}
        .plan li{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--ink);line-height:1.5}
        .plan li svg{flex-shrink:0;margin-top:2px;color:var(--orange)}
        .plan .cta{margin-top:6px;text-align:center;padding:12px 14px;border-radius:12px;font-size:13px;font-weight:700;border:1.5px solid rgba(26,18,8,.15);background:rgba(255,255,255,.7);color:var(--coffee)}
        .plan .cta:hover{background:#fff}
        .quote{max-width:880px;margin:0 auto;text-align:center}
        .quote .q{font-size:clamp(24px,2.8vw,36px);font-weight:500;color:var(--coffee);letter-spacing:-.01em;line-height:1.3}
        .quote .q em{font-style:normal;color:var(--orange)}
        .quote .who{margin-top:24px;font-size:13px;color:var(--mud-2);letter-spacing:.1em;text-transform:uppercase;font-weight:700}
        .final{position:relative;overflow:hidden;background:linear-gradient(135deg,var(--coffee) 0%,#2d2010 100%);color:#fff;text-align:center;padding:120px 28px}
        .final::before{content:"";position:absolute;inset:0;opacity:.35;background:radial-gradient(600px 400px at 20% 20%,rgba(217,119,6,.35),transparent 60%),radial-gradient(500px 350px at 80% 80%,rgba(217,119,6,.2),transparent 60%)}
        .final > *{position:relative;z-index:1}
        .final h2{font-size:clamp(40px,6vw,78px);font-weight:800;letter-spacing:-.035em;margin:0;line-height:1}
        .final h2 em{font-style:normal;color:var(--orange)}
        .final p{color:var(--gold);font-size:18px;margin-top:18px}
        .final .sm{color:rgba(255,255,255,.45);font-size:12px;margin-top:6px;letter-spacing:.04em}
        .final .btn-orange{margin-top:32px;padding:18px 28px;font-size:16px;border-radius:16px}
        footer.foot{background:var(--cream);padding:50px 28px 60px;border-top:1px solid var(--border)}
        .foot-row{max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1.4fr repeat(3,1fr);gap:30px}
        @media(max-width:820px){.foot-row{grid-template-columns:1fr 1fr}}
        .foot h5{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--mud-2);margin:0 0 14px;font-weight:800}
        .foot ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
        .foot li a{font-size:13px;color:var(--ink)}
        .foot li a:hover{color:var(--orange)}
        .foot-tag{max-width:320px;font-size:13px;color:var(--mud);line-height:1.55;margin-top:14px}
        .copyright{max-width:1240px;margin:36px auto 0;padding-top:22px;border-top:1px solid var(--border);display:flex;justify-content:space-between;color:var(--mud-2);font-size:12px}
        svg{display:inline-block;vertical-align:middle}
      `}} />

      <header className="nav">
        <div className="nav-row">
          <a href="#" className="brand">
            <Image src="/logo-light.jpeg" alt="Accountant's Best Friend" width={80} height={80} className="brand-logo" unoptimized />
          </a>
          <nav className="nav-links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#alladin">Alladin AI</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login" style={{color:'var(--coffee)',fontWeight:600}}>Sign in</Link>
            <Link href="/login?mode=signup" className="nav-cta">Start free →</Link>
          </nav>
        </div>
      </header>

      <div className="hero-text">
        <h1 className="hero-title">Bookkeeping<br/>Made Easy</h1>
        <p className="hero-sub">Upload your bank statements, let AI do the sorting, and walk into tax season with everything organized.</p>
        <div className="hero-ctas">
          <Link href="/login?mode=signup" className="btn btn-orange" style={{fontSize:17,padding:'16px 32px',borderRadius:16}}>Start free today
            <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </Link>
          <a href="#how" className="btn btn-ghost" style={{fontSize:17,padding:'16px 32px',borderRadius:16}}>See how it works</a>
        </div>
        <div className="hero-trust">
          <span><span className="tick">✓</span> 30-day free trial</span>
          <span><span className="tick">✓</span> No credit card</span>
          <span><span className="tick">✓</span> MFA &amp; RLS built in</span>
          <span><span className="tick">✓</span> Alladin AI included</span>
        </div>
      </div>

      <div className="hero-video-wrap">
        <video className="hero-video" autoPlay muted loop playsInline poster="/demo-poster.jpg">
          <source src="/demo.mp4" type="video/mp4" />
        </video>
      </div>

      <section className="band white" id="how">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow orange">How it works</div>
            <h2>From raw data to clean reports<br/>in <em>4 steps</em>.</h2>
            <p className="sub">No jumping between spreadsheets, email threads, and different software. Every step handled in one tool.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="num">01</div>
              <div className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg></div>
              <h3>Import</h3>
              <p>Drop a CSV from any bank or card. Column names are auto-detected — date, description, amount, and more.</p>
            </div>
            <div className="step">
              <div className="num">02</div>
              <div className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4zM19 12l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5L19 12zM16 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/></svg></div>
              <h3>Map &amp; Categorize</h3>
              <p>Map columns once. AI assigns IRS expense categories to every transaction. Review and adjust anything that needs tweaking.</p>
            </div>
            <div className="step">
              <div className="num">03</div>
              <div className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M7 14l4-4 4 4 5-5"/></svg></div>
              <h3>Review</h3>
              <p>Browse dashboards, monthly trends, and category breakdowns. Attach receipts and documents to any entry.</p>
            </div>
            <div className="step">
              <div className="num">04</div>
              <div className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg></div>
              <h3>Export</h3>
              <p>One-click Excel, CSV, or QuickBooks QBO files — exactly what your accountant needs at tax time.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="band" id="features">
        <div className="wrap">
          <div className="feature-row">
            <div className="copy">
              <div className="eyebrow orange">Workflow · Fast bank import</div>
              <h3>Raw CSV in.<br/>Clean categorized books out.</h3>
              <p>Designed for real accounting workflows. Auto-map columns from any bank format — then approve, adjust, or override AI category suggestions in a single pass.</p>
              <ul>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Handles quoted fields, escaped quotes, multiline values (RFC 4180)</li>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>30+ IRS Schedule C categories, applied automatically</li>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Track every entry back to its original source file</li>
              </ul>
            </div>
            <div className="vis">
              <div className="vis-csv">
                <div className="lanes">
                  <div className="lane">
                    <div className="ltitle"><span>Before</span><b>raw_chase.csv</b></div>
                    <div className="csv-line"><b>03/14</b> SQ *BLUE BOTTLE…</div>
                    <div className="csv-line"><b>03/14</b> UBER TRIP HELP.UBER…</div>
                    <div className="csv-line"><b>03/15</b> ADOBE *CREATIVE CL…</div>
                    <div className="csv-line"><b>03/15</b> AMZN MKTP US*TK…</div>
                    <div className="csv-line"><b>03/16</b> DELTA AIR 00628…</div>
                    <div className="csv-line"><b>03/16</b> STAPLES 0012 TAMPA…</div>
                    <div className="csv-line"><b>03/17</b> USPS PO 11234…</div>
                    <div className="csv-line"><b>03/17</b> ZOOM.US 888-799…</div>
                    <div className="csv-line" style={{borderBottom:'none'}}>…</div>
                  </div>
                  <div className="arrow-pill">→</div>
                  <div className="lane">
                    <div className="ltitle"><span>After</span><b>IRS Schedule C</b></div>
                    <div className="cat-chip"><span className="who">Blue Bottle</span><span className="cat">Meals</span></div>
                    <div className="cat-chip"><span className="who">Uber Trip</span><span className="cat">Travel</span></div>
                    <div className="cat-chip"><span className="who">Adobe CC</span><span className="cat">Software</span></div>
                    <div className="cat-chip"><span className="who">Amazon</span><span className="cat">Supplies</span></div>
                    <div className="cat-chip"><span className="who">Delta Air</span><span className="cat">Travel</span></div>
                    <div className="cat-chip"><span className="who">Staples</span><span className="cat">Office</span></div>
                    <div className="cat-chip"><span className="who">USPS</span><span className="cat">Postage</span></div>
                    <div className="cat-chip"><span className="who">Zoom</span><span className="cat">Software</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-row flip" id="alladin">
            <div className="copy">
              <div className="eyebrow orange">Intelligence · Alladin AI</div>
              <h3>Ask questions.<br/>Get real answers.</h3>
              <p>Alladin AI reads your transaction data and answers in plain English. Spending summaries, category breakdowns, and anomaly flags — without writing a single formula.</p>
              <ul>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>&ldquo;What did we spend on meals this quarter?&rdquo;</li>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Instant category totals and month-over-month trends</li>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Flags unusual charges and duplicate entries automatically</li>
              </ul>
            </div>
            <div className="vis">
              <div className="chat" id="chatBox">
                <div className="chat-head">
                  <div className="chat-avatar">✦</div>
                  <div>
                    <h4>Ask <em>Alladin</em></h4>
                    <p>Reading your 2026 expenses · 1,248 transactions</p>
                  </div>
                </div>
                <div id="chatMessages" style={{display:'flex',flexDirection:'column',gap:10,minHeight:230}}></div>
                <div className="chat-input">
                  <span>Ask anything about your books…</span>
                  <span className="caret"></span>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-row">
            <div className="copy">
              <div className="eyebrow orange">Security · Safer access</div>
              <h3>Your financial data,<br/>locked up tight.</h3>
              <p>Multi-factor authentication, role-based permissions, and soft-delete with trash recovery mean your books stay protected — even as your team grows.</p>
              <ul>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Viewer, Contributor, and Admin roles per company</li>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>MFA required on all accounts</li>
                <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Deleted entries recoverable from trash — never lost for good</li>
              </ul>
            </div>
            <div className="vis">
              <div className="vault">
                <div className="vitem">
                  <div className="vic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
                  <h5>MFA required</h5>
                  <p>TOTP on every account. No exceptions.</p>
                </div>
                <div className="vitem">
                  <div className="vic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M13 7a4 4 0 11-8 0 4 4 0 018 0zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
                  <h5>3 access roles</h5>
                  <p>Viewer, Contributor, Admin — per company.</p>
                </div>
                <div className="vitem">
                  <div className="vic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></div>
                  <h5>Trash recovery</h5>
                  <p>Soft-delete keeps everything restorable.</p>
                </div>
                <div className="vitem">
                  <div className="vic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                  <h5>Row-level security</h5>
                  <p>Postgres RLS. Your data never crosses.</p>
                </div>
                <div className="big">
                  <div>
                    <b>All your data, your data only.</b>
                    <div style={{fontSize:12,color:'var(--gold)',marginTop:2}}>Isolated storage per account · Receipts encrypted at rest</div>
                  </div>
                  <span>Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="band white" style={{padding:'70px 0'}}>
        <div className="wrap">
          <div className="stats">
            <div className="stat"><div className="n">30+</div><div className="l">IRS Schedule C categories</div></div>
            <div className="stat"><div className="n">4</div><div className="l">Steps: Import → Export</div></div>
            <div className="stat"><div className="n">3</div><div className="l">Role-based access levels</div></div>
            <div className="stat"><div className="n">0</div><div className="l">Spreadsheets required</div></div>
          </div>
        </div>
      </section>

      <section className="band" style={{padding:'90px 0'}}>
        <div className="wrap-sm">
          <div className="section-head">
            <div className="eyebrow orange">IRS Schedule C ready</div>
            <h2>Every category<br/>your accountant expects.</h2>
            <p className="sub">Straight out of the IRS Schedule C line items — pre-mapped and ready to export. Override anything with one click.</p>
          </div>
          <div className="cat-cloud">
            <span className="featured">Advertising</span><span>Car &amp; Truck</span><span>Commissions</span>
            <span className="featured">Contract Labor</span><span>Depletion</span><span>Depreciation</span>
            <span>Employee Benefits</span><span className="featured">Insurance</span><span>Interest — Mortgage</span>
            <span>Interest — Other</span><span className="featured">Legal &amp; Professional</span><span>Office Expense</span>
            <span>Pension Plans</span><span>Rent — Vehicles</span><span className="featured">Rent — Other</span>
            <span>Repairs &amp; Maintenance</span><span className="featured">Supplies</span><span>Taxes &amp; Licenses</span>
            <span className="featured">Travel</span><span>Meals</span><span>Utilities</span>
            <span className="featured">Wages</span><span>Software</span><span>Postage</span>
            <span>Bank Fees</span><span>Subscriptions</span><span className="featured">Home Office</span>
            <span>Education</span><span>Charitable</span><span>Other</span>
          </div>
        </div>
      </section>

      <section className="band white">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow orange">What you get</div>
            <h2>Everything you need to <em>close the books</em>.</h2>
            <p className="sub">No add-ons. No hidden extras. One tool, one subscription, one very happy accountant.</p>
          </div>
          <div className="caps">
            <div className="cap">
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg></div>
              <h4>Fast bank import</h4>
              <p>Upload any bank or credit card CSV. Columns are matched automatically so you skip the manual mapping every time.</p>
            </div>
            <div className="cap">
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z"/></svg></div>
              <h4>AI categorization</h4>
              <p>Every transaction gets an IRS expense category. Review the suggestions and override anything that doesn&apos;t look right.</p>
            </div>
            <div className="cap">
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg></div>
              <h4>Organized by company</h4>
              <p>Separate folders for each company, year, and month keep books clean — even when you&apos;re juggling multiple clients.</p>
            </div>
            <div className="cap">
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M7 14l4-4 4 4 5-5"/></svg></div>
              <h4>Live financial visibility</h4>
              <p>Dashboards and monthly breakdowns give you a real-time view of spending — no waiting for tax season to see where money went.</p>
            </div>
            <div className="cap">
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6"/></svg></div>
              <h4>Export-ready output</h4>
              <p>One-click export to Excel, CSV, or QBO format. Clean, structured files that go straight to your accountant.</p>
            </div>
            <div className="cap">
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
              <h4>Alladin AI assistant</h4>
              <p>Ask questions about your expenses in plain English. &ldquo;What did we spend on travel in Q3?&rdquo; — Alladin answers instantly from your data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="band" style={{padding:'110px 0'}}>
        <div className="wrap-sm">
          <div className="quote">
            <div className="q">&ldquo;I used to spend <em>three full days</em> each quarter hand-categorizing expenses. Now I drop in the CSV, review the suggestions, and export. <em>It&apos;s a completely different job.</em>&rdquo;</div>
            <div className="who">— a self-employed consultant, somewhere in Tampa</div>
          </div>
        </div>
      </section>

      <section className="band white" id="pricing">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow orange">Simple pricing</div>
            <h2>Pick your plan.<br/>Switch whenever.</h2>
            <p className="sub">Start FREE for 30 days — no credit card required. Cancel anytime.</p>
          </div>
          <div className="plans">
            <div className="plan plan-mint">
              <h4>Individual</h4>
              <div className="price"><b>$10</b><span> /mo</span></div>
              <div className="fees">Single user · Unlimited transactions</div>
              <ul>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>CSV import &amp; export</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>IRS Schedule C categories</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Receipt attachments</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Excel &amp; QBO export</li>
              </ul>
              <Link href="/login?mode=signup" className="cta">Start free</Link>
            </div>
            <div className="plan plan-peach">
              <div className="tag">Most Popular</div>
              <h4>Business</h4>
              <div className="price"><b>$25</b><span> /mo</span></div>
              <div className="fees">Up to 4 users · Team collaboration</div>
              <ul>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Everything in Individual</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Up to 4 team members</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Role-based permissions</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Priority support</li>
              </ul>
              <Link href="/login?mode=signup" className="cta">Start free</Link>
            </div>
            <div className="plan plan-lavender">
              <h4>Elite</h4>
              <div className="price"><b>$100</b><span> /mo</span></div>
              <div className="fees">Up to 20 users · Dedicated manager</div>
              <ul>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Everything in Business</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Up to 20 team members</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Dedicated account manager</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Priority support</li>
              </ul>
              <Link href="/login?mode=signup" className="cta">Start free</Link>
            </div>
            <div className="plan plan-sky">
              <h4>Private Server</h4>
              <div className="price"><b>$250</b><span> /mo</span></div>
              <div className="fees">Dedicated VPS · Your own instance</div>
              <ul>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Everything in Elite</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Your own secured copy of ABF</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Isolated infrastructure</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Deployed to your environment</li>
              </ul>
              <Link href="/contact" className="cta">Talk to us</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="final">
        <div className="eyebrow" style={{color:'var(--orange)'}}>It&apos;s time</div>
        <h2>Stop chasing receipts.<br/><em>Start closing the books.</em></h2>
        <p>Upload your first CSV in the next 30 seconds.</p>
        <div className="sm">No credit card · Cancel anytime · 30-day free trial</div>
        <Link href="/login?mode=signup" className="btn btn-orange">Start free today
          <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </Link>
      </section>

      <footer className="foot">
        <div className="foot-row">
          <div>
            <a href="#" className="brand">
              <Image src="/logo-light.jpeg" alt="Accountant's Best Friend" width={80} height={80} className="brand-logo" unoptimized />
            </a>
            <p className="foot-tag">Personal expense categorization for self-employed professionals. CSV in, clean books out. Built in Tampa. Used at 3am on April 14.</p>
          </div>
          <div>
            <h5>Product</h5>
            <ul>
              <li><a href="#how">How it works</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#alladin">Alladin AI</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h5>Account</h5>
            <ul>
              <li><Link href="/login">Sign in</Link></li>
              <li><Link href="/login?mode=signup">Start free trial</Link></li>
              <li><Link href="/login?mode=signup">Invite your accountant</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h5>Legal</h5>
            <ul>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/privacy">Security</Link></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
        </div>
        <div className="copyright">
          <span>© 2026 Accountant&apos;s Best Friend. All rights reserved.</span>
          <span>Made for the self-employed. Made with very dark coffee.</span>
        </div>
      </footer>
    </>
  );
}

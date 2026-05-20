import { useState, useEffect, useRef, useCallback } from "react";


const ADMIN_PASS = "wtfnikhil";
const STORAGE_KEY = "wtf_insights_v1";
const SUGGESTIONS_KEY = "wtf_suggestions_v1";
const SAMPLE_INSIGHTS = [];

const TOPICS = ["Investing", "Startups", "Technology", "Health", "Life"];

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@400;500;700&family=Syne:wght@700;800&display=swap');`;

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #000000;
    --paper: #fcf9f2;
    --paper-bg: #1b4df1; /* Vibrant Royal Blue */
    --border-thick: 3.5px solid #000000;
    --border-thin: 2px solid #000000;
    
    /* Comic Accents */
    --accent-yellow: #ffd600;
    --accent-pink: #ff007a;
    --accent-green: #00e5a3;
    --accent-blue: #00b0ff;
    
    /* Topic Pastels */
    --topic-investing: #fff2a3;
    --topic-startups: #ffb3d1;
    --topic-technology: #a3ffd6;
    --topic-health: #a3e3ff;
    --topic-life: #e8d1ff;
    
    --font-heading: 'Syne', sans-serif;
    --font-body: 'Space Grotesk', sans-serif;
    --font-pixel: 'Press Start 2P', monospace;
  }
  body { 
    background-color: transparent; 
    color: var(--ink); 
    font-family: var(--font-body);
  }
  .ballpit-wrap {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-color: var(--paper-bg);
    background-image: radial-gradient(rgba(0,0,0,0.15) 1.5px, transparent 1.5px);
    background-size: 24px 24px;
  }
  .site-container {
    width: 100%;
  }
  button { font-family: var(--font-body); cursor: pointer; }
  input, textarea, select { font-family: var(--font-body); }

  /* Scroll to top */
  .scroll-top {
    position: fixed;
    bottom: 32px;
    right: 32px;
    width: 44px;
    height: 44px;
    border: var(--border-thin);
    border-radius: 8px;
    background: var(--accent-yellow);
    color: var(--ink);
    font-size: 20px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 3px 3px 0px #000;
    cursor: pointer;
    z-index: 100;
    transition: all 0.2s ease;
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
  }
  .scroll-top.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  .scroll-top:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0px #000;
    background: var(--accent-pink);
    color: #fff;
  }
  .scroll-top:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0px #000;
  }

  /* Random insight highlight */
  .ins-card.highlighted {
    border-color: var(--accent-pink);
    box-shadow: 0 0 0 3px var(--accent-pink), 8px 8px 0px #000;
  }

  .masthead {
    border-bottom: var(--border-thick);
    padding: 16px 32px;
    display: flex; align-items: center; justify-content: space-between;
    background: #ffffff; position: sticky; top: 0; z-index: 50;
    box-shadow: 0px 4px 0px rgba(0,0,0,0.1);
  }
  .logo { 
    font-family: var(--font-heading); 
    font-size: 30px; 
    font-weight: 800; 
    letter-spacing: -1px; 
    line-height: 1; 
    text-transform: uppercase;
    color: var(--ink);
    text-shadow: 2px 2px 0px var(--accent-pink);
  }
  .logo span { color: var(--accent-pink); text-shadow: 2px 2px 0px var(--ink); }
  .logo-sub { 
    font-family: var(--font-pixel);
    font-size: 8px; 
    color: #000; 
    letter-spacing: 0.5px; 
    text-transform: uppercase; 
    font-weight: 400; 
    margin-top: 5px; 
  }
  .masthead-right { display: flex; align-items: center; gap: 14px; }
  .search-wrap { position: relative; }
  .search-input {
    padding: 10px 14px 10px 38px; 
    border: var(--border-thin); 
    border-radius: 6px;
    font-size: 14px; 
    background: #fff; 
    color: var(--ink); 
    width: 240px; 
    outline: none; 
    font-weight: 500;
    box-shadow: 2.5px 2.5px 0px #000;
    transition: all 0.15s ease;
  }
  .search-input:focus { 
    transform: translate(-1px, -1px);
    box-shadow: 3.5px 3.5px 0px #000;
  }
  .search-icon { 
    position: absolute; 
    left: 12px; 
    top: 50%; 
    transform: translateY(-50%); 
    font-size: 16px; 
    color: var(--ink); 
    pointer-events: none; 
  }

  .btn {
    font-family: var(--font-body);
    font-size: 12px; font-weight: 700; padding: 10px 18px; border-radius: 6px;
    letter-spacing: 0.5px; text-transform: uppercase; transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: var(--border-thin); background: #ffffff; color: var(--ink);
    box-shadow: 3px 3px 0px #000;
  }
  .btn:hover { 
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0px #000;
    background: var(--accent-yellow);
  }
  .btn:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0px #000;
  }
  .btn:disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
    transform: none !important;
    box-shadow: 1px 1px 0px #000 !important;
  }
  .btn-solid { background: var(--accent-yellow); color: var(--ink); }
  .btn-solid:hover { background: var(--accent-yellow); }
  .btn-accent { background: var(--accent-pink); color: #fff; }
  .btn-accent:hover { background: var(--accent-pink); }

  .pending-count-badge {
    margin-left: 6px;
    background: var(--accent-pink);
    color: #fff;
    border: var(--border-thin);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-family: var(--font-pixel);
    font-size: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    box-shadow: 1.5px 1.5px 0px #000;
  }

  .hero {
    padding: 40px 32px 36px; 
    border-bottom: var(--border-thick);
    display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: center;
    background-color: var(--paper-bg);
    background-image: radial-gradient(rgba(255,255,255,0.15) 1.5px, transparent 1.5px);
    background-size: 16px 16px;
  }
  .hero-label { 
    font-family: var(--font-pixel);
    font-size: 10px; 
    letter-spacing: 0px; 
    text-transform: uppercase; 
    background: var(--accent-yellow);
    color: #000;
    display: inline-block;
    padding: 6px 12px;
    border: var(--border-thin);
    box-shadow: 3px 3px 0px #000;
    transform: rotate(-1deg);
    margin-bottom: 14px;
  }
  .hero-title { 
    font-family: var(--font-heading); 
    font-size: clamp(30px, 4.5vw, 52px); 
    font-weight: 800; 
    line-height: 1.05; 
    color: #ffffff; 
    text-transform: uppercase;
    text-shadow: 3px 3px 0px #000;
  }
  .hero-title em { 
    font-style: normal; 
    color: var(--accent-yellow);
    text-shadow: 4px 4px 0px #000;
    display: inline-block;
  }
  .hero-desc { 
    margin-top: 16px; 
    font-size: 14px; 
    max-width: 460px; 
    line-height: 1.55; 
    font-weight: 500; 
    background: #000;
    color: #fff;
    padding: 12px 16px;
    border: var(--border-thick);
    box-shadow: 4px 4px 0px var(--accent-yellow);
    border-radius: 6px;
  }
  .hero-actions { display: flex; gap: 14px; margin-top: 18px; align-items: center; }
  .hero-stats { display: flex; gap: 16px; }
  .stat-item { 
    padding: 14px 20px; 
    border: var(--border-thick); 
    text-align: center; 
    box-shadow: 4px 4px 0px #000;
    border-radius: 8px;
    transform: rotate(1.5deg);
    transition: all 0.15s ease;
  }
  .stat-item:nth-child(1) { background: var(--accent-yellow); transform: rotate(-2deg); }
  .stat-item:nth-child(2) { background: var(--accent-pink); color: #fff; transform: rotate(1deg); }
  .stat-item:nth-child(3) { background: var(--accent-green); transform: rotate(-1deg); }
  
  .stat-item:hover { transform: scale(1.05) rotate(0deg); }
  
  .stat-num { font-family: var(--font-pixel); font-size: 26px; color: var(--ink); line-height: 1.2; }
  .stat-item:nth-child(2) .stat-num { color: #fff; }
  
  .stat-lbl { font-size: 10px; color: var(--ink); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; font-weight: 800; }
  .stat-item:nth-child(2) .stat-lbl { color: #fff; }

  .filter-bar {
    padding: 16px 32px; display: flex; gap: 12px; align-items: center;
    border-bottom: var(--border-thick); flex-wrap: wrap;
    background: #ffffff; position: sticky; top: 76px; z-index: 40;
  }
  .filter-bar.sub-filter {
    top: 138px;
    background: #ffffff;
    border-bottom: var(--border-thin);
    padding: 10px 32px;
  }
  .filter-label { 
    font-family: var(--font-pixel);
    font-size: 9px; 
    text-transform: uppercase; 
    color: var(--ink); 
    border: var(--border-thin);
    padding: 6px 12px;
    background: #fff;
    box-shadow: 2px 2px 0px #000;
  }
  .tag {
    font-family: var(--font-body);
    font-size: 12px; padding: 7px 16px; border-radius: 6px; border: var(--border-thin);
    background: #fff; color: var(--ink); font-weight: 700; transition: all 0.15s ease;
    box-shadow: 2.5px 2.5px 0px #000;
  }
  .tag:hover { 
    transform: translate(-1px, -1px);
    box-shadow: 3.5px 3.5px 0px #000;
  }
  .tag.active { 
    background: var(--accent-pink); 
    color: #fff; 
    box-shadow: 3.5px 3.5px 0px #000; 
  }
  .filter-divider { width: 3px; height: 24px; background: var(--ink); margin: 0 8px; }
  .view-toggle { margin-left: auto; display: flex; border: var(--border-thin); border-radius: 6px; overflow: hidden; box-shadow: 2.5px 2.5px 0px #000; }
  .vt-btn {
    font-family: var(--font-body);
    font-size: 12px; padding: 8px 18px; background: #fff; color: var(--ink);
    border: none; font-weight: 700; text-transform: uppercase; transition: all 0.15s ease;
  }
  .vt-btn + .vt-btn { border-left: var(--border-thin); }
  .vt-btn.active { background: var(--accent-green); color: var(--ink); }

  /* Episode pills */
  .ep-pill {
    font-size: 12px; padding: 6px 14px; border-radius: 6px; border: var(--border-thin);
    background: #fff; color: var(--ink); font-weight: 700; transition: all 0.15s ease; white-space: nowrap;
    box-shadow: 2px 2px 0px #000;
  }
  .ep-pill:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0px #000; }
  .ep-pill.active { background: var(--accent-pink); color: #fff; }

  .neo-select {
    padding: 8px 36px 8px 14px;
    border: var(--border-thin);
    border-radius: 6px;
    font-size: 13px;
    font-family: var(--font-body);
    background: #fff;
    color: var(--ink);
    font-weight: 700;
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000000' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    min-width: 220px;
    max-width: 320px;
    box-shadow: 2.5px 2.5px 0px #000;
    transition: all 0.15s ease;
  }
  .neo-select:hover, .neo-select:focus {
    transform: translate(-1px, -1px);
    box-shadow: 3.5px 3.5px 0px #000;
  }
  .btn-clear {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 700;
    padding: 6px 12px;
    border: var(--border-thin);
    border-radius: 6px;
    background: #fff;
    color: var(--accent-pink);
    cursor: pointer;
    box-shadow: 2px 2px 0px #000;
    transition: all 0.1s;
    margin-left: 10px;
    text-transform: uppercase;
  }
  .btn-clear:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0px #000;
    background: var(--accent-pink);
    color: #fff;
  }
  .btn-clear:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0px #000;
  }

  .ep-grid { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 32px;
    padding: 40px 32px;
  }
  @media (max-width: 768px) {
    .ep-grid { grid-template-columns: 1fr; padding: 20px 16px; }
    .hero { grid-template-columns: 1fr; gap: 24px; padding: 40px 16px; }
    .hero-stats { justify-content: space-between; width: 100%; }
    .filter-bar { padding: 16px; }
    .filter-bar.sub-filter { top: 180px; }
  }

  .ins-card {
    background: #fff;
    padding: 30px; 
    border: var(--border-thick);
    border-radius: 8px;
    box-shadow: 8px 8px 0px #000;
    transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
    position: relative; 
    display: flex; 
    flex-direction: column; 
    gap: 16px;
  }
  .ins-card:hover { 
    transform: translate(-6px, -6px) rotate(0.5deg); 
    box-shadow: 14px 14px 0px #000; 
  }
  
  .card-number {
    position: absolute;
    top: -15px;
    right: 15px;
    font-family: var(--font-pixel);
    font-size: 14px;
    background: #fff;
    color: #000;
    border: var(--border-thin);
    border-radius: 4px;
    padding: 6px 8px;
    box-shadow: 3px 3px 0px #000;
    transform: rotate(3deg);
    z-index: 10;
    transition: all 0.15s ease;
  }
  .ins-card:hover .card-number, .tl-item:hover .card-number {
    background: var(--accent-yellow);
    transform: rotate(-3deg) scale(1.1);
  }

  .card-ep-label { 
    font-family: var(--font-pixel);
    font-size: 8px; 
    color: var(--ink); 
    text-transform: uppercase; 
    letter-spacing: 0px; 
    border-bottom: var(--border-thin);
    padding-bottom: 10px;
    margin-bottom: 2px;
    max-width: calc(100% - 40px);
  }
  .card-quote { 
    font-family: var(--font-body); 
    font-size: 19px; 
    font-weight: 700; 
    line-height: 1.45; 
    color: var(--ink); 
    flex: 1; 
  }
  .card-quote::before { 
    content: "“"; 
    color: var(--accent-pink); 
    font-family: var(--font-heading);
    font-size: 44px; 
    line-height: 0; 
    vertical-align: -12px; 
    margin-right: 6px; 
  }
  .card-takeaway { 
    font-size: 14px; 
    color: var(--ink); 
    line-height: 1.6; 
    font-weight: 500; 
    background: #ffffff;
    padding: 14px 16px;
    border: var(--border-thin);
    border-radius: 6px;
    box-shadow: inset 2px 2px 0px rgba(0,0,0,0.05);
  }
  .card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
  .card-tag { 
    font-family: var(--font-pixel);
    font-size: 8px; 
    padding: 6px 12px; 
    border: var(--border-thin); 
    color: var(--ink); 
    border-radius: 4px; 
    text-transform: uppercase; 
    background: #fff;
    box-shadow: 2px 2px 0px #000;
    transform: rotate(-1.5deg);
  }
  .card-meta { display: flex; align-items: center; gap: 10px; }
  .card-ts { 
    font-family: var(--font-pixel);
    font-size: 8px; 
    color: var(--ink); 
    background: #fff;
    padding: 4px 8px;
    border: var(--border-thin);
    border-radius: 4px;
    box-shadow: 1.5px 1.5px 0px #000;
  }
  .card-delete { 
    font-size: 16px; 
    color: var(--ink); 
    background: #fff; 
    border: var(--border-thin); 
    border-radius: 6px;
    box-shadow: 2.5px 2.5px 0px #000;
    cursor: pointer; 
    padding: 2px 8px; 
    transition: all 0.15s ease; 
    font-weight: 700;
  }
  .card-delete:hover { 
    background: var(--accent-pink); 
    color: #fff; 
    transform: translate(-1px, -1px);
    box-shadow: 3.5px 3.5px 0px #000;
  }
  .card-delete:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0px #000;
  }

  .share-btn {
    font-family: var(--font-body);
    font-size: 11px; font-weight: 700;
    background: #fff; border: var(--border-thin); border-radius: 6px;
    padding: 5px 12px; color: var(--ink); cursor: pointer; transition: all 0.15s ease; 
    display: flex; align-items: center; gap: 6px;
    box-shadow: 2.5px 2.5px 0px #000;
  }
  .share-btn:hover { 
    background: var(--accent-blue);
    color: #fff;
    transform: translate(-1px, -1px);
    box-shadow: 3.5px 3.5px 0px #000;
  }
  .share-btn.copied { 
    background: var(--accent-green); 
    color: var(--ink); 
    box-shadow: 1.5px 1.5px 0px #000;
    transform: translate(1px, 1px);
  }

  .empty-state { 
    padding: 80px 32px; 
    text-align: center; 
    color: var(--ink); 
    grid-column: 1/-1; 
    background: #fff;
    border: var(--border-thick);
    border-radius: 8px;
    box-shadow: 6px 6px 0px #000;
  }
  .empty-title { font-family: var(--font-heading); font-size: 28px; font-weight: 800; color: var(--ink); margin-bottom: 12px; }

  .topic-section { padding: 0; border-bottom: var(--border-thick); }
  .topic-section.topic-view { padding: 48px 32px; }
  .topic-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
  .topic-header.accordion-header {
    margin-bottom: 0;
    padding: 24px 32px;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease;
  }
  .topic-header.accordion-header:hover {
    background: rgba(255, 214, 0, 0.08);
  }
  .accordion-chevron {
    width: 32px;
    height: 32px;
    border: var(--border-thin);
    border-radius: 6px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 800;
    color: var(--ink);
    box-shadow: 2px 2px 0px #000;
    transition: transform 0.25s ease, background 0.15s ease;
    flex-shrink: 0;
  }
  .accordion-chevron.open {
    transform: rotate(180deg);
    background: var(--accent-pink);
    color: #fff;
  }
  .accordion-body {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s ease;
  }
  .accordion-body.open {
    grid-template-rows: 1fr;
  }
  .accordion-body-inner {
    overflow: hidden;
  }
  .topic-name { 
    font-family: var(--font-heading); 
    font-size: 34px; 
    font-weight: 800; 
    color: var(--ink); 
    text-transform: uppercase;
    background: var(--accent-yellow);
    padding: 6px 20px;
    border: var(--border-thick);
    box-shadow: 4px 4px 0px #000;
    transform: rotate(-1.5deg);
  }
  .topic-count { 
    font-family: var(--font-pixel);
    font-size: 8px; 
    color: var(--ink); 
    text-transform: uppercase; 
    background: #fff;
    padding: 6px 12px;
    border: var(--border-thin);
    box-shadow: 2.5px 2.5px 0px #000;
    transform: rotate(1deg);
  }
  .topic-rule { flex: 1; height: 4px; background: #fff; border: var(--border-thin); }
  .topic-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  .tl-item {
    padding: 24px; border: var(--border-thick); border-radius: 8px;
    background: #fff; transition: all 0.2s ease; display: flex; flex-direction: column; gap: 14px;
    box-shadow: 6px 6px 0px #000;
    position: relative;
  }
  .tl-item:hover { 
    transform: translate(-4px, -4px) rotate(-0.5deg); 
    box-shadow: 10px 10px 0px #000; 
  }
  .tl-quote { font-family: var(--font-body); font-size: 17px; font-weight: 700; line-height: 1.45; color: var(--ink); }
  .tl-quote::before { content: "“"; color: var(--accent-pink); font-size: 36px; line-height: 0; vertical-align: -8px; }
  .tl-meta { display: flex; align-items: center; justify-content: space-between; border-top: var(--border-thin); padding-top: 12px; }
  .tl-ep { font-family: var(--font-pixel); font-size: 8px; color: var(--ink); text-transform: uppercase; }
  .tl-ts { 
    font-family: var(--font-pixel);
    font-size: 8px; 
    color: var(--ink); 
    background: #fff;
    padding: 4px 8px;
    border: var(--border-thin);
    border-radius: 4px;
    box-shadow: 1.5px 1.5px 0px #000;
  }

  /* Suggest banner */
  .suggest-banner {
    border-top: var(--border-thick); border-bottom: var(--border-thick);
    padding: 30px 32px; display: flex; align-items: center; justify-content: space-between;
    background: var(--topic-investing);
    background-image: radial-gradient(rgba(0,0,0,0.06) 1.5px, transparent 1.5px);
    background-size: 12px 12px;
  }
  .suggest-banner-text { font-size: 16px; color: var(--ink); font-weight: 500; }
  .suggest-banner-text strong { color: var(--ink); font-weight: 700; }

  .overlay {
    position: fixed; inset: 0; background: rgba(17, 63, 204, 0.85);
    z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px;
    backdrop-filter: blur(5px);
  }
  .modal {
    background: var(--paper); width: 100%; max-width: 600px;
    max-height: 90vh; overflow-y: auto; border-radius: 8px; border: var(--border-thick);
    box-shadow: 12px 12px 0px #000;
  }
  .modal-head {
    padding: 22px 24px; border-bottom: var(--border-thick);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--accent-yellow);
  }
  .modal-title { font-family: var(--font-heading); font-size: 26px; font-weight: 800; text-transform: uppercase; color: var(--ink); text-shadow: 2px 2px 0px #fff; }
  .modal-close { 
    background: #fff; border: var(--border-thin); font-family: var(--font-pixel); font-size: 14px; color: var(--ink); padding: 4px 10px; cursor: pointer; 
    border-radius: 6px; box-shadow: 2.5px 2.5px 0px #000; transition: all 0.1s;
  }
  .modal-close:hover { transform: translate(-1px, -1px); box-shadow: 3.5px 3.5px 0px #000; background: var(--accent-pink); color: #fff; }
  .modal-body { padding: 28px; }
  .field { margin-bottom: 20px; }
  .field label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--ink); font-weight: 700; margin-bottom: 8px; }
  .field input, .field textarea, .field select {
    width: 100%; padding: 12px 16px; border: var(--border-thin); border-radius: 6px;
    font-size: 14px; background: #fff; color: var(--ink); outline: none; transition: all 0.15s ease;
    box-shadow: 2.5px 2.5px 0px #000;
    font-weight: 500;
  }
  .field input:focus, .field textarea:focus, .field select:focus { 
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0px #000;
  }
  .field textarea { min-height: 90px; resize: vertical; line-height: 1.5; }
  .modal-footer { padding: 16px 24px; border-top: var(--border-thick); display: flex; gap: 12px; justify-content: flex-end; background: #fff; }
  .auth-hint { font-size: 12px; color: var(--ink); margin-top: 8px; font-weight: 500; }
  .field-error { border-color: var(--accent-pink) !important; background: #fff5f5 !important; }
  .error-msg { font-size: 12px; color: var(--accent-pink); margin-top: 6px; font-weight: 700; }

  .neo-badge-accent {
    margin-left: 12px;
    font-family: var(--font-pixel);
    font-size: 9px;
    background: var(--accent-pink);
    color: #fff;
    border: var(--border-thin);
    border-radius: 6px;
    padding: 4px 10px;
    box-shadow: 2px 2px 0px #000;
    transform: rotate(-1deg);
    display: inline-block;
  }

  .ai-panel { 
    background: var(--topic-investing); 
    border: var(--border-thick); 
    border-radius: 8px; 
    padding: 24px; 
    margin-bottom: 28px; 
    box-shadow: 4px 4px 0px #000;
  }
  .ai-panel-title { font-family: var(--font-pixel); font-size: 10px; text-transform: uppercase; color: var(--ink); margin-bottom: 12px; }
  .ai-steps { font-size: 13px; color: var(--ink); line-height: 1.8; margin-bottom: 0px; font-weight: 500; }
  .ai-steps a { color: var(--accent-pink); font-weight: 700; text-decoration: underline; }
  
  .transcript-box {
    width: 100%; min-height: 120px; max-height: 180px; padding: 12px 16px;
    border: var(--border-thin); border-radius: 6px; font-size: 14px;
    background: #fff; color: var(--ink); outline: none; resize: vertical;
    line-height: 1.5; font-family: var(--font-body); transition: all 0.15s ease; margin-bottom: 16px;
    box-shadow: 2.5px 2.5px 0px #000;
  }
  .transcript-box:focus { transform: translate(-1px, -1px); box-shadow: 4px 4px 0px #000; }
  
  .ep-name-row { display: flex; gap: 14px; margin-bottom: 16px; }
  .ep-name-row input {
    flex: 1; padding: 12px 16px; border: var(--border-thin); border-radius: 6px;
    font-size: 14px; background: #fff; color: var(--ink); outline: none; font-family: var(--font-body);
    box-shadow: 2.5px 2.5px 0px #000;
  }
  .ep-name-row input:focus { transform: translate(-1px, -1px); box-shadow: 4px 4px 0px #000; }
  
  .ai-loading { font-size: 14px; color: var(--ink); padding: 10px 0; display: flex; align-items: center; gap: 10px; font-weight: 700; }
  .spinner { width: 18px; height: 18px; border: 3px solid #eee; border-top-color: var(--accent-pink); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .extracted-list { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
  .extracted-card { 
    border: var(--border-thin); 
    border-radius: 8px; 
    padding: 18px 22px; 
    background: #fff; 
    display: flex; 
    gap: 16px; 
    align-items: flex-start; 
    box-shadow: 4px 4px 0px #000;
    transition: all 0.15s ease;
    position: relative;
  }
  .extracted-card:hover { transform: translate(-1px, -1px); box-shadow: 5px 5px 0px #000; }
  .extracted-card.selected { border-color: var(--accent-pink); background: #fff8f9; box-shadow: 4px 4px 0px var(--accent-pink); }
  
  .ext-check { 
    width: 24px; height: 24px; border: var(--border-thin); border-radius: 6px; flex-shrink: 0; cursor: pointer; 
    display: flex; align-items: center; justify-content: center; background: #fff; transition: all 0.1s; 
    box-shadow: 1.5px 1.5px 0px #000;
  }
  .ext-check.checked { background: var(--accent-pink); border-color: var(--ink); color: #fff; font-size: 12px; font-weight: 700; }
  .ext-body { flex: 1; min-width: 0; }
  .ext-quote { font-family: var(--font-body); font-size: 16px; font-weight: 700; line-height: 1.45; color: var(--ink); margin-bottom: 6px; }
  .ext-takeaway { font-size: 13px; color: var(--ink); line-height: 1.5; margin-bottom: 12px; font-weight: 500; }
  .ext-meta { display: flex; gap: 10px; align-items: center; }
  .ext-topic { 
    font-family: var(--font-body);
    font-size: 11px; padding: 4px 8px; border: var(--border-thin); border-radius: 4px; color: var(--ink); text-transform: uppercase; 
    letter-spacing: 0.5px; cursor: pointer; background: #fff; font-weight: 700; box-shadow: 1.5px 1.5px 0px #000;
  }
  .ext-ts { 
    font-size: 11px; 
    color: var(--ink); 
    font-weight: 700; 
    background: #fff;
    padding: 2px 6px;
    border: var(--border-thin);
    border-radius: 4px;
  }
  
  .select-all-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: var(--border-thin); padding-bottom: 8px; }
  .select-all-label { font-family: var(--font-pixel); font-size: 9px; color: var(--ink); cursor: pointer; text-decoration: underline; }
  .selected-count { font-family: var(--font-pixel); font-size: 9px; color: var(--accent-pink); font-weight: 700; }
  .divider { height: 4px; background: var(--ink); margin: 28px 0; }
  .tabs { display: flex; border-bottom: var(--border-thin); margin-bottom: 20px; gap: 4px; }
  .tab-btn { 
    font-family: var(--font-pixel);
    font-size: 10px; font-weight: 700; text-transform: uppercase; 
    padding: 12px 18px; background: #fff; border: var(--border-thin); border-bottom: none; 
    border-top-left-radius: 6px; border-top-right-radius: 6px;
    color: var(--ink); cursor: pointer; margin-bottom: -2px; transition: all 0.15s ease; 
    box-shadow: 1px -1.5px 0px #000;
  }
  .tab-btn.active { background: var(--accent-yellow); color: var(--ink); border-bottom: 2px solid var(--accent-yellow); }

  /* Suggestions in admin */
  .suggestion-item { padding: 20px 0; border-bottom: var(--border-thin); }
  .suggestion-item:last-child { border-bottom: none; }
  .sug-quote { font-family: var(--font-body); font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
  .sug-meta { font-family: var(--font-pixel); font-size: 8px; color: var(--ink); margin-bottom: 12px; }
  .sug-actions { display: flex; gap: 10px; }
  .empty-suggestions { font-size: 14px; color: var(--ink); padding: 30px 0; text-align: center; font-weight: 700; }

  .toast {
    position: fixed; bottom: 36px; left: 50%; transform: translateX(-50%) translateY(140px);
    background: var(--accent-green); color: var(--ink); font-family: var(--font-pixel); font-size: 10px;
    padding: 16px 30px; border-radius: 6px; z-index: 999;
    border: var(--border-thick);
    box-shadow: 5px 5px 0px #000;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); white-space: nowrap;
    text-transform: uppercase;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }

  .footer { border-top: var(--border-thick); padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; background: #ffffff; }
  .footer-text { font-size: 13px; color: var(--ink); letter-spacing: 0.3px; font-weight: 700; }
  .footer-text a { color: var(--accent-pink); text-decoration: underline; font-weight: 700; }
  .footer-logo { font-family: var(--font-heading); font-size: 24px; font-weight: 800; color: var(--ink); text-transform: uppercase; text-shadow: 2px 2px 0px var(--accent-pink); }
  .footer-logo span { color: var(--accent-pink); text-shadow: 2px 2px 0px var(--ink); }

`;

export default function App() {
  const [insights, setInsights] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [suggestions, setSuggestions] = useState(() => {
    try { const s = localStorage.getItem(SUGGESTIONS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [topic, setTopic] = useState("all");
  const [epFilter, setEpFilter] = useState("all");
  const [view, setView] = useState("episodes");
  const [search, setSearch] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [sugForm, setSugForm] = useState({ ep: "", quote: "", context: "", name: "" });
  const [sugErr, setSugErr] = useState({});
  const [sugSent, setSugSent] = useState(false);
  const [openEp, setOpenEp] = useState(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(insights)); }, [insights]);
  useEffect(() => { localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions)); }, [suggestions]);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = FONTS + css;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const uniqueEps = [...new Set(insights.map((i) => i.ep))];

  const filtered = insights.filter((i) => {
    const matchTopic = topic === "all" || i.topic === topic;
    const matchEp = epFilter === "all" || i.ep === epFilter;
    const matchSearch = !search ||
      i.quote.toLowerCase().includes(search.toLowerCase()) ||
      i.ep.toLowerCase().includes(search.toLowerCase()) ||
      i.takeaway.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchEp && matchSearch;
  });

  const episodeGroups = [];
  const epMap = {};
  filtered.forEach((ins) => {
    if (!epMap[ins.ep]) {
      epMap[ins.ep] = [];
      episodeGroups.push({ ep: ins.ep, items: epMap[ins.ep] });
    }
    epMap[ins.ep].push(ins);
  });

  const submitSuggestion = () => {
    const errs = {};
    if (!sugForm.ep.trim()) errs.ep = "Required";
    if (!sugForm.quote.trim()) errs.quote = "Required";
    setSugErr(errs);
    if (Object.keys(errs).length) return;
    setSuggestions((prev) => [{ ...sugForm, id: Date.now().toString(), date: new Date().toISOString().split("T")[0], status: "pending" }, ...prev]);
    setSugSent(true);
  };

  return (
    <>
      <div className="ballpit-wrap" />
      <div className="site-container">
        <header className="masthead">
          <div>
            <div className="logo">WTF<span>Insights</span></div>
            <div className="logo-sub">Curated from the WTF is Podcast</div>
          </div>
          <div className="masthead-right">
            <div className="search-wrap">
              <span className="search-icon">&#x2315;</span>
              <input className="search-input" placeholder="Search insights..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button className="btn" onClick={() => { setSugSent(false); setSugForm({ ep: "", quote: "", context: "", name: "" }); setShowSuggest(true); }}>
              Suggest
            </button>
          </div>
        </header>

        <section className="hero">
          <div>
            <div className="hero-label">Every episode. Every insight. No fluff.</div>
            <h1 className="hero-title">What Nikhil Kamath<br />actually <em>said.</em></h1>
          </div>
        </section>

        <div className="filter-bar">
          <span className="filter-label">Topic</span>
          {["all", ...TOPICS].map((t) => (
            <button key={t} className={`tag${topic === t ? " active" : ""}`} onClick={() => setTopic(t)}>
              {t === "all" ? "All" : t}
            </button>
          ))}
          <div className="view-toggle">
            <button className={`vt-btn${view === "episodes" ? " active" : ""}`} onClick={() => setView("episodes")}>Episodes</button>
            <button className={`vt-btn${view === "topics" ? " active" : ""}`} onClick={() => setView("topics")}>By Topic</button>
          </div>
        </div>

        {view === "episodes" && (
          <div>
            {episodeGroups.map((group) => {
              const isOpen = openEp === group.ep;
              return (
                <div className="topic-section" key={group.ep}>
                  <div className="topic-header accordion-header" onClick={() => setOpenEp(isOpen ? null : group.ep)}>
                    <span className="topic-name">{group.ep}</span>
                    <span className="topic-count">{group.items.length} insight{group.items.length > 1 ? "s" : ""}</span>
                    <div className="topic-rule" />
                    <span className={`accordion-chevron${isOpen ? " open" : ""}`}>▼</span>
                  </div>
                  {isOpen && (
                    <div className="ep-grid">
                      {group.items.map((ins) => (
                        <div className="ins-card" key={ins.id}>
                          <div className="card-quote">{ins.quote}</div>
                          <div className="card-takeaway">{ins.takeaway}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showSuggest && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowSuggest(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-head">
              <div className="modal-title">Suggest an insight</div>
              <button className="modal-close" onClick={() => setShowSuggest(false)}>&#215;</button>
            </div>
            {sugSent ? (
              <div className="modal-body" style={{ textAlign: "center", padding: "40px 24px" }}>
                <div style={{ fontSize: 32, marginBottom: 12, fontWeight: 800 }}>✓</div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, marginBottom: 8, textTransform: "uppercase" }}>Thanks!</div>
                <div>Your suggestion has been submitted.</div>
              </div>
            ) : (
              <>
                <div className="modal-body">
                  <div className="field">
                    <label>Episode name</label>
                    <input value={sugForm.ep} onChange={(e) => setSugForm({ ...sugForm, ep: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>The quote</label>
                    <textarea value={sugForm.quote} onChange={(e) => setSugForm({ ...sugForm, quote: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn" onClick={() => setShowSuggest(false)}>Cancel</button>
                  <button className="btn btn-solid" onClick={submitSuggestion}>Submit</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
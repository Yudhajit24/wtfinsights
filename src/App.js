import { useState, useEffect, useRef, useCallback } from "react";
import { db, isFirebaseConfigured } from "./firebase";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);


const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASSCODE || "wtfnikhil";
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
  .hero-actions { display: flex; gap: 14px; margin-top: 18px; align-items: center; flex-wrap: wrap; }
  .hero-stats { display: flex; gap: 16px; flex-wrap: wrap; }
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
    .topic-grid { grid-template-columns: 1fr; }
    .hero { grid-template-columns: 1fr; gap: 24px; padding: 40px 16px; }
    .hero-stats { justify-content: flex-start; width: 100%; gap: 12px; }
    .filter-bar { padding: 16px; position: static; justify-content: flex-start; }
    .filter-bar.sub-filter { position: static; padding: 12px 16px; }
    .masthead { padding: 16px; flex-direction: column; gap: 16px; align-items: center; position: static; }
    .masthead-right { flex-wrap: wrap; justify-content: center; width: 100%; }
    .search-wrap { width: 100%; }
    .search-input { width: 100%; }
    .topic-section.topic-view { padding: 24px 16px; }
    .topic-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    .topic-header.accordion-header { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; }
    .neo-select { width: 100%; min-width: 0; }
    .empty-state { padding: 40px 16px; }
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

  .play-btn {
    font-family: var(--font-body);
    font-size: 11px; font-weight: 700;
    background: var(--accent-yellow); border: var(--border-thin); border-radius: 6px;
    padding: 5px 12px; color: var(--ink); cursor: pointer; transition: all 0.15s ease; 
    display: flex; align-items: center; gap: 6px;
    box-shadow: 2.5px 2.5px 0px #000;
    white-space: nowrap;
  }
  .play-btn:hover { 
    background: var(--accent-pink);
    color: #fff;
    transform: translate(-1px, -1px);
    box-shadow: 3.5px 3.5px 0px #000;
  }

  /* Video Modal */
  .video-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    backdrop-filter: blur(4px);
  }
  .video-modal-box {
    background: #fff;
    border: var(--border-thick);
    box-shadow: 10px 10px 0px #000;
    border-radius: 4px;
    width: 100%;
    max-width: 760px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .video-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: var(--border-thin);
    background: var(--paper);
  }
  .video-modal-title {
    font-family: var(--font-pixel);
    font-size: 9px;
    color: var(--accent-pink);
    text-transform: uppercase;
    max-width: calc(100% - 50px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .video-modal-close {
    width: 30px; height: 30px;
    border: var(--border-thin);
    background: var(--accent-yellow);
    font-size: 16px; font-weight: 800;
    cursor: pointer;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 2px 2px 0px #000;
    flex-shrink: 0;
  }
  .video-modal-close:hover { background: var(--accent-pink); color: #fff; }
  .video-modal-iframe-wrap {
    position: relative;
    width: 100%;
    padding-top: 56.25%;
  }
  .video-modal-iframe-wrap iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
  .video-modal-footer {
    padding: 10px 16px;
    border-top: var(--border-thin);
    background: var(--paper);
    font-family: var(--font-pixel);
    font-size: 8px;
    color: #666;
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

  /* Database Backup Tab CSS */
  .backup-section {
    background: #fff;
    border: var(--border-thin);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 3.5px 3.5px 0px #000;
  }
  .backup-section h3 {
    font-family: var(--font-heading);
    font-size: 16px;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .backup-section p {
    font-size: 13px;
    color: #555;
    margin-bottom: 14px;
    line-height: 1.5;
  }
  .storage-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border: var(--border-thin);
    border-radius: 6px;
    font-family: var(--font-pixel);
    font-size: 9px;
    text-transform: uppercase;
    font-weight: 700;
    box-shadow: 2px 2px 0px #000;
    margin-bottom: 20px;
  }
  .storage-badge.local {
    background: var(--accent-yellow);
    color: #000;
  }
  .storage-badge.cloud {
    background: var(--accent-green);
    color: #000;
  }
  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #000;
    display: inline-block;
  }
  .storage-badge.cloud .badge-dot {
    background: #000;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0% { transform: scale(0.9); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.5; }
    100% { transform: scale(0.9); opacity: 1; }
  }

`;

async function extractInsightsWithAI(transcript, episodeName) {
  const prompt = `You are extracting insights from a podcast transcript of the WTF is podcast by Nikhil Kamath.

Episode: "${episodeName}"

Transcript:
${transcript.slice(0, 12000)}

Extract the 5-8 most insightful, quotable moments. For each one:
- Find the speaker's exact words (or close paraphrase if transcript is rough)
- Identify the speaker (e.g. "Nikhil Kamath", "Kunal Shah", etc.)
- Write a plain-language takeaway (1-2 sentences)
- Classify into one of: Investing, Startups, Technology, Health, Life
- Estimate a rough timestamp if inferable (otherwise leave empty string)

Respond ONLY with a JSON array, no preamble, no markdown backticks:
[{"quote":"...","speaker":"Nikhil Kamath","takeaway":"...","topic":"Investing","ts":"0:12:34"}]`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.REACT_APP_GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const msg = errBody?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";

  // Strip markdown code fences and find the JSON array
  let clean = text.replace(/```json|```/g, "").trim();
  // Extract just the [...] array in case there's prose around it
  const arrayMatch = clean.match(/(\[\s*\{[\s\S]*\}\s*\])/m);
  if (arrayMatch) clean = arrayMatch[1];

  try {
    return JSON.parse(clean);
  } catch (parseErr) {
    throw new Error(`AI returned unexpected format. Raw response: ${text.slice(0, 300)}`);
  }
}

export default function App() {
  const appRef = useRef(null);
  const [insights, setInsights] = useState(() => {
    if (isFirebaseConfigured) return [];
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : SAMPLE_INSIGHTS; } catch { return SAMPLE_INSIGHTS; }
  });
  const [suggestions, setSuggestions] = useState(() => {
    if (isFirebaseConfigured) return [];
    try { const s = localStorage.getItem(SUGGESTIONS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [dbLoading, setDbLoading] = useState(isFirebaseConfigured);

  const [topic, setTopic] = useState("all");
  const [epFilter, setEpFilter] = useState("all");
  const [speakerFilter, setSpeakerFilter] = useState("all");
  const [view, setView] = useState("episodes");
  const [search, setSearch] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [authErr, setAuthErr] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [formErr, setFormErr] = useState({});
  const [form, setForm] = useState({ ep: "", speaker: "Nikhil Kamath", quote: "", takeaway: "", topic: "Investing", ts: "" });
  const [sugForm, setSugForm] = useState({ ep: "", speaker: "", quote: "", context: "", name: "" });
  const [sugErr, setSugErr] = useState({});
  const [sugSent, setSugSent] = useState(false);
  const [adminTab, setAdminTab] = useState("ai");
  const [adminSubTab, setAdminSubTab] = useState("add");
  const [copiedId, setCopiedId] = useState(null);
  const [openEp, setOpenEp] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [highlightedInsight, setHighlightedInsight] = useState(null);

  const [epName, setEpName] = useState("");
  const [epVideoUrl, setEpVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState([]);
  const [selected, setSelected] = useState([]);
  const [extractErr, setExtractErr] = useState("");
  const [activeVideo, setActiveVideo] = useState(null); // { videoId, startSec, title }

  const passRef = useRef();

  const parseYouTubeVideoId = (url) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
      return u.searchParams.get("v") || "";
    } catch { return url.trim(); }
  };

  const parseTimestampToSeconds = (ts) => {
    if (!ts) return 0;
    const parts = ts.replace(/[hms]/g, "").split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  const openVideoClip = (ins) => {
    const videoId = ins.videoId;
    if (!videoId) return;
    const startSec = parseTimestampToSeconds(ins.ts);
    setActiveVideo({ videoId, startSec, title: ins.ep });
  };

  // --- GSAP ANIMATIONS ---
  useEffect(() => {
    if (dbLoading) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-title, .hero-desc, .hero-actions, .stat-item", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.5)",
        delay: 0.1,
        clearProps: "all"
      });
    }, appRef);
    return () => ctx.revert();
  }, [dbLoading]);

  useEffect(() => {
    if (dbLoading) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      const cards = gsap.utils.toArray('.ins-card, .tl-item');
      cards.forEach((card, i) => {
        gsap.fromTo(card, 
          { y: 50, opacity: 0 },
          {
            scrollTrigger: {
              trigger: card,
              start: "top bottom-=40",
              toggleActions: "play none none none"
            },
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
            delay: i < 6 ? i * 0.08 : 0,
            clearProps: "all"
          }
        );
      });
    }, appRef);
    return () => ctx.revert();
  }, [insights, view, topic, epFilter, search, dbLoading]);
  // ----------------------

  useEffect(() => {
    if (isFirebaseConfigured) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(insights));
  }, [insights]);

  useEffect(() => {
    if (isFirebaseConfigured) return;
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
  }, [suggestions]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    setDbLoading(true);
    const loadData = async () => {
      try {
        const snapshot = await getDocs(collection(db, "insights"));
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id });
        });
        list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setInsights(list);

        const sugSnapshot = await getDocs(collection(db, "suggestions"));
        const sugList = [];
        sugSnapshot.forEach((doc) => {
          sugList.push({ ...doc.data(), id: doc.id });
        });
        setSuggestions(sugList);
      } catch (err) {
        console.error("Error loading from Cloud Firestore:", err);
      } finally {
        setDbLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = FONTS + css;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const randomInsight = useCallback(() => {
    if (insights.length === 0) return;
    const ins = insights[Math.floor(Math.random() * insights.length)];
    setHighlightedInsight(ins.id);
    // Open that episode's accordion
    setOpenEp(ins.ep);
    // Clear any filters so we can see it
    setTopic('all');
    setEpFilter('all');
    setView('episodes');
    setSearch('');
    // Scroll to the card after a brief delay for accordion to open
    setTimeout(() => {
      const el = document.getElementById(`card-${ins.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
    // Clear highlight after 3s
    setTimeout(() => setHighlightedInsight(null), 3500);
  }, [insights]);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2800);
  };

  const uniqueEps = [...new Set(insights.map((i) => i.ep))];
  const uniqueSpeakers = [...new Set(insights.map((i) => i.speaker).filter(Boolean))].sort();

  const getInsightOfTheDay = () => {
    if (insights.length === 0) return null;
    const today = new Date().toISOString().split("T")[0];
    let hash = 0;
    for (let i = 0; i < today.length; i++) hash = today.charCodeAt(i) + ((hash << 5) - hash);
    return insights[Math.abs(hash) % insights.length];
  };
  const insightOfTheDay = getInsightOfTheDay();

  const filtered = insights.filter((i) => {
    const matchTopic = topic === "all" || i.topic === topic;
    const matchEp = epFilter === "all" || i.ep === epFilter;
    const matchSpeaker = speakerFilter === "all" || i.speaker === speakerFilter;
    const matchSearch = !search ||
      i.quote.toLowerCase().includes(search.toLowerCase()) ||
      i.ep.toLowerCase().includes(search.toLowerCase()) ||
      (i.speaker && i.speaker.toLowerCase().includes(search.toLowerCase())) ||
      i.takeaway.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchEp && matchSpeaker && matchSearch;
  });

  const uniqueTopics = [...new Set(insights.map((i) => i.topic))].length;

  const checkAuth = () => {
    if (passRef.current?.value === ADMIN_PASS) {
      setShowAuth(false); setAuthErr(false);
      passRef.current.value = "";
      setShowAdmin(true);
    } else { setAuthErr(true); }
  };

  const addInsight = async () => {
    const errs = {};
    if (!form.ep.trim()) errs.ep = "Required";
    if (!form.speaker.trim()) errs.speaker = "Required";
    if (!form.quote.trim()) errs.quote = "Required";
    if (!form.takeaway.trim()) errs.takeaway = "Required";
    setFormErr(errs);
    if (Object.keys(errs).length) return;

    const newInsight = {
      ep: form.ep,
      videoId: parseYouTubeVideoId(form.videoUrl || ""),
      speaker: form.speaker,
      quote: form.quote,
      takeaway: form.takeaway,
      topic: form.topic,
      ts: form.ts || "",
      date: new Date().toISOString().split("T")[0],
    };

    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, "insights"), newInsight);
        setInsights((prev) => [{ ...newInsight, id: docRef.id }, ...prev]);
        setForm({ ep: "", speaker: "Nikhil Kamath", videoUrl: "", quote: "", takeaway: "", topic: "Investing", ts: "" });
        showToast("Insight published successfully!");
      } catch (err) {
        console.error(err);
        showToast("Error publishing insight");
      }
    } else {
      const localInsight = { ...newInsight, id: Date.now().toString() };
      setInsights((prev) => [localInsight, ...prev]);
      setForm({ ep: "", speaker: "Nikhil Kamath", videoUrl: "", quote: "", takeaway: "", topic: "Investing", ts: "" });
      showToast("Insight published successfully!");
    }
  };

  // eslint-disable-next-line no-unused-vars
  const deleteInsight = (id) => { setInsights((prev) => prev.filter((i) => i.id !== id)); showToast("Removed"); };

  const shareInsight = (ins) => {
    const text = `"${ins.quote}"\n\n— from the WTF is Podcast by @nikhilkamathcio\n\nMore insights: wtfinsights.vercel.app`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(ins.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleExtract = async () => {
    if (!transcript.trim()) { setExtractErr("Paste the transcript first."); return; }
    if (!epName.trim()) { setExtractErr("Enter the episode name first."); return; }
    setExtractErr(""); setExtracting(true); setExtracted([]); setSelected([]);
    try {
      const results = await extractInsightsWithAI(transcript, epName);
      setExtracted(results);
      setSelected(results.map((_, i) => i));
    } catch (e) { setExtractErr(e.message || "Something went wrong. Check your API key or try again."); }
    setExtracting(false);
  };

  const publishSelected = async () => {
    const videoId = parseYouTubeVideoId(epVideoUrl);
    const toAdd = selected.map((i) => ({
      ep: epName,
      videoId: videoId || "",
      speaker: extracted[i].speaker || "Nikhil Kamath",
      quote: extracted[i].quote,
      takeaway: extracted[i].takeaway,
      topic: extracted[i].topic,
      ts: extracted[i].ts || "",
      date: new Date().toISOString().split("T")[0],
    }));

    if (isFirebaseConfigured) {
      try {
        const addedList = [];
        for (const item of toAdd) {
          const docRef = await addDoc(collection(db, "insights"), item);
          addedList.push({ ...item, id: docRef.id });
        }
        setInsights((prev) => [...addedList, ...prev]);
        setExtracted([]); setSelected([]); setTranscript(""); setEpName(""); setEpVideoUrl("");
        showToast(`${toAdd.length} insight${toAdd.length > 1 ? "s" : ""} published`);
      } catch (err) {
        console.error(err);
        showToast("Error publishing insights");
      }
    } else {
      const addedList = toAdd.map((item, idx) => ({ ...item, id: Date.now().toString() + "_" + idx }));
      setInsights((prev) => [...addedList, ...prev]);
      setExtracted([]); setSelected([]); setTranscript(""); setEpName(""); setEpVideoUrl("");
      showToast(`${toAdd.length} insight${toAdd.length > 1 ? "s" : ""} published`);
    }
  };

  const submitSuggestion = async () => {
    const errs = {};
    if (!sugForm.ep.trim()) errs.ep = "Required";
    if (!sugForm.quote.trim()) errs.quote = "Required";
    setSugErr(errs);
    if (Object.keys(errs).length) return;

    const newSug = {
      ep: sugForm.ep,
      speaker: sugForm.speaker || "",
      quote: sugForm.quote,
      context: sugForm.context || "",
      name: sugForm.name || "",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    };

    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, "suggestions"), newSug);
        setSuggestions((prev) => [{ ...newSug, id: docRef.id }, ...prev]);
        setSugSent(true);
      } catch (err) {
        console.error(err);
        showToast("Error submitting suggestion");
      }
    } else {
      const localSug = { ...newSug, id: Date.now().toString() };
      setSuggestions((prev) => [localSug, ...prev]);
      setSugSent(true);
    }
  };

  const approveSuggestion = async (sug) => {
    const newInsight = {
      ep: sug.ep,
      speaker: sug.speaker || "Nikhil Kamath",
      quote: sug.quote,
      takeaway: sug.context || "Community suggested insight.",
      topic: "Life",
      ts: "",
      date: sug.date || new Date().toISOString().split("T")[0]
    };

    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, "insights"), newInsight);
        setInsights((prev) => [{ ...newInsight, id: docRef.id }, ...prev]);
        await deleteDoc(doc(db, "suggestions", sug.id));
        setSuggestions((prev) => prev.filter((s) => s.id !== sug.id));
        showToast("Suggestion published!");
      } catch (err) {
        console.error(err);
        showToast("Error approving suggestion");
      }
    } else {
      const localInsight = { ...newInsight, id: Date.now().toString() };
      setInsights((prev) => [localInsight, ...prev]);
      setSuggestions((prev) => prev.filter((s) => s.id !== sug.id));
      showToast("Suggestion published!");
    }
  };

  const rejectSuggestion = async (id) => {
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, "suggestions", id));
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        showToast("Suggestion dismissed");
      } catch (err) {
        console.error(err);
        showToast("Error dismissing suggestion");
      }
    } else {
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      showToast("Suggestion removed");
    }
  };

  const exportDatabase = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(insights, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "wtf_insights_backup.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Database exported successfully!");
    } catch (e) {
      console.error(e);
      showToast("Error exporting database");
    }
  };

  const importDatabase = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) {
          showToast("Invalid format: Must be a JSON array.");
          return;
        }

        const isValid = data.every(item => item.ep && item.quote && item.takeaway);
        if (!isValid && data.length > 0) {
          showToast("Invalid backup: Missing required fields.");
          return;
        }

        const overwrite = window.confirm(
          `Found ${data.length} insights in file. Do you want to OVERWRITE the current database? (Cancel will MERGE them instead)`
        );

        let updatedInsights;
        if (overwrite) {
          updatedInsights = data.map((item, idx) => ({
            ...item,
            id: item.id || (Date.now().toString() + "_" + idx)
          }));
        } else {
          const existingKeys = new Set(insights.map(i => `${i.ep.trim()}|${i.quote.trim()}`));
          const newItems = data.filter(item => !existingKeys.has(`${item.ep.trim()}|${item.quote.trim()}`)).map((item, idx) => ({
            ...item,
            id: item.id || (Date.now().toString() + "_" + idx)
          }));
          updatedInsights = [...newItems, ...insights];
        }

        if (isFirebaseConfigured) {
          showToast("Importing to Cloud Firestore...");
          if (overwrite) {
            const snapshot = await getDocs(collection(db, "insights"));
            for (const d of snapshot.docs) {
              await deleteDoc(doc(db, "insights", d.id));
            }
          }
          const uploadedList = [];
          for (const item of updatedInsights) {
            const cleanedItem = { ...item };
            delete cleanedItem.id;
            const docRef = await addDoc(collection(db, "insights"), cleanedItem);
            uploadedList.push({ ...cleanedItem, id: docRef.id });
          }
          setInsights(uploadedList);
          showToast("Database fully synced to Firestore!");
        } else {
          setInsights(updatedInsights);
          showToast(overwrite ? "Database fully overwritten!" : "Database successfully merged!");
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const topicGroups = TOPICS.map((t) => ({ name: t, items: filtered.filter((i) => i.topic === t) })).filter((g) => g.items.length > 0);
  const pendingSuggestions = suggestions.filter((s) => s.status === "pending");

  // Group filtered insights by episode name
  const episodeGroups = [];
  const epMap = {};
  filtered.forEach((ins) => {
    if (!epMap[ins.ep]) {
      epMap[ins.ep] = [];
      episodeGroups.push({ ep: ins.ep, items: epMap[ins.ep] });
    }
    epMap[ins.ep].push(ins);
  });

  return (
    <div ref={appRef}>
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
          <button className="btn btn-solid" onClick={() => setShowAuth(true)}>
            + Add {pendingSuggestions.length > 0 && <span className="pending-count-badge">{pendingSuggestions.length}</span>}
          </button>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="hero-label">Every episode. Every insight. No fluff.</div>
          <h1 className="hero-title">What Nikhil Kamath<br />actually <em>said.</em></h1>
          <p className="hero-desc">The sharpest quotes, frameworks, and takeaways from the WTF is podcast — distilled for people who'd rather think than scroll.</p>
          <div className="hero-actions">
            <button className="btn btn-accent" onClick={randomInsight}>🎲 Random Insight</button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-item"><div className="stat-num">{insights.length}</div><div className="stat-lbl">Insights</div></div>
          <div className="stat-item"><div className="stat-num">{uniqueEps.length}</div><div className="stat-lbl">Episodes</div></div>
          <div className="stat-item"><div className="stat-num">{uniqueTopics}</div><div className="stat-lbl">Topics</div></div>
        </div>
      </section>

      {insightOfTheDay && (
        <section className="iotd-section" style={{ padding: '32px', background: 'var(--paper)', borderBottom: 'var(--border-thick)' }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-pink)', marginBottom: 16, textTransform: 'uppercase' }}>🌟 Insight of the Day</div>
          <div className="ins-card highlight-card" style={{ border: '3px solid var(--accent-pink)', boxShadow: '8px 8px 0px var(--accent-pink)', background: '#fff' }}>
            <div className="card-ep-label">
              {insightOfTheDay.ep}
              {insightOfTheDay.speaker && <span style={{ marginLeft: 8, color: "var(--accent-pink)", fontWeight: 800 }}>• {insightOfTheDay.speaker}</span>}
            </div>
            <div className="card-quote">{insightOfTheDay.quote}</div>
            <div className="card-takeaway" style={{ background: 'var(--paper)', border: 'var(--border-thin)' }}>{insightOfTheDay.takeaway}</div>
          </div>
        </section>
      )}

      {/* Topic filter */}
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

      {/* Episode & Speaker filter dropdowns */}
      {(uniqueEps.length > 0 || uniqueSpeakers.length > 0) && (
        <div className="filter-bar sub-filter">
          <span className="filter-label">Episode</span>
          <select
            value={epFilter}
            onChange={(e) => setEpFilter(e.target.value)}
            className="neo-select"
          >
            <option value="all">All episodes</option>
            {uniqueEps.map((ep) => (
              <option key={ep} value={ep}>{ep}</option>
            ))}
          </select>

          {uniqueSpeakers.length > 0 && (
            <>
              <span className="filter-label" style={{ marginLeft: 16 }}>Speaker</span>
              <select
                value={speakerFilter}
                onChange={(e) => setSpeakerFilter(e.target.value)}
                className="neo-select"
              >
                <option value="all">All speakers</option>
                {uniqueSpeakers.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </>
          )}

          {(epFilter !== "all" || speakerFilter !== "all") && (
            <button
              className="btn-clear"
              onClick={() => { setEpFilter("all"); setSpeakerFilter("all"); }}
            >
              ✕ Clear Filters
            </button>
          )}
        </div>
      )}

      {dbLoading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 20px" }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, marginBottom: 16 }} />
          <div style={{ fontFamily: "var(--font-pixel)", fontSize: 11, textTransform: "uppercase" }}>Loading from Cloud Firestore...</div>
        </div>
      ) : (
        <>
          {view === "episodes" && (
        <div>
          {episodeGroups.length === 0 ? (
            <div className="ep-grid">
              <div className="empty-state">
                <div className="empty-title">No insights found</div>
                <p>Try a different search or filter.</p>
              </div>
            </div>
          ) : (
            episodeGroups.map((group) => {
              const isOpen = openEp === group.ep;
              return (
                <div className="topic-section" key={group.ep}>
                  <div className="topic-header accordion-header" onClick={() => setOpenEp(isOpen ? null : group.ep)}>
                    <span className="topic-name">{group.ep}</span>
                    <span className="topic-count">{group.items.length} insight{group.items.length > 1 ? "s" : ""}</span>
                    <div className="topic-rule" />
                    <span className={`accordion-chevron${isOpen ? " open" : ""}`}>▼</span>
                  </div>
                  <div className={`accordion-body${isOpen ? " open" : ""}`}>
                    <div className="accordion-body-inner">
                      <div className="ep-grid">
                        {group.items.map((ins, idx) => (
                          <div className={`ins-card topic-${ins.topic.toLowerCase()}${highlightedInsight === ins.id ? ' highlighted' : ''}`} key={ins.id} id={`card-${ins.id}`}>
                            <div className="card-number">{String(idx + 1).padStart(2, '0')}</div>
                            {ins.speaker && (
                              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'var(--accent-pink)', textTransform: 'uppercase', marginBottom: -4 }}>
                                🗣 {ins.speaker}
                              </div>
                            )}
                            <div className="card-quote">{ins.quote}</div>
                            <div className="card-takeaway">{ins.takeaway}</div>
                            <div className="card-footer">
                              <span className="card-tag">{ins.topic}</span>
                              <div className="card-meta">
                                {ins.ts && <span className="card-ts">{ins.ts}</span>}
                                {ins.videoId && ins.ts && (
                                  <button
                                    className="play-btn"
                                    onClick={() => openVideoClip(ins)}
                                    title="Watch this clip on YouTube"
                                  >
                                    ▶ Watch Clip
                                  </button>
                                )}
                                <button
                                  className={`share-btn${copiedId === ins.id ? " copied" : ""}`}
                                  onClick={() => shareInsight(ins)}
                                  title="Copy to share on X"
                                >
                                  {copiedId === ins.id ? "✓ Copied" : "↗ Share"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {view === "topics" && (
        <div>
          {topicGroups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">No insights found</div>
              <p>Try a different filter.</p>
            </div>
          ) : (
            topicGroups.map((group) => (
              <div className="topic-section topic-view" key={group.name}>
                <div className="topic-header">
                  <span className="topic-name">{group.name}</span>
                  <span className="topic-count">{group.items.length} insight{group.items.length > 1 ? "s" : ""}</span>
                  <div className="topic-rule" />
                </div>
                <div className="topic-grid">
                  {group.items.map((ins, i) => (
                    <div className={`tl-item topic-${ins.topic.toLowerCase()}`} key={ins.id}>
                      <div className="card-number">{String(i + 1).padStart(2, '0')}</div>
                      {ins.speaker && (
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'var(--accent-pink)', textTransform: 'uppercase', marginBottom: -4 }}>
                          🗣 {ins.speaker}
                        </div>
                      )}
                      <div className="tl-quote">{ins.quote}</div>
                      <div className="tl-meta">
                        <span className="tl-ep">{ins.ep}</span>
                        {ins.ts && <span className="tl-ts">{ins.ts}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
        </>
      )}

      {/* Suggest banner */}
      <div className="suggest-banner">
        <div className="suggest-banner-text">
          <strong>Heard something powerful?</strong> Submit a quote and help build this for the community.
        </div>
        <button className="btn" onClick={() => { setSugSent(false); setSugForm({ ep: "", quote: "", context: "", name: "" }); setShowSuggest(true); }}>
          Suggest an insight
        </button>
      </div>

      <footer className="footer">
        <div className="footer-text">
          Not affiliated with Nikhil Kamath or WTF is Podcast. Built by Yudhajit Mondal (
          <a href="https://www.linkedin.com/in/yudhajit-mondal-28a67725b/" target="_blank" rel="noreferrer">LinkedIn</a> ·{" "}
          <a href="https://x.com/MondalYudhajit" target="_blank" rel="noreferrer">X</a>)
        </div>
        <div className="footer-logo">WTF<span>Insights</span></div>
      </footer>

      </div>{/* end site-container */}

      <button className={`scroll-top${showScrollTop ? ' visible' : ''}`} onClick={scrollToTop} title="Back to top">↑</button>
      <div className={`toast${toast.show ? " show" : ""}`}>{toast.msg}</div>

      {/* Suggest Modal */}
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
                <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>Your suggestion has been submitted for review.</div>
              </div>
            ) : (
              <>
                <div className="modal-body">
                  <div className="field">
                    <label>Episode name</label>
                    <input placeholder="e.g. WTF is Investing?" value={sugForm.ep} className={sugErr.ep ? "field-error" : ""} onChange={(e) => setSugForm({ ...sugForm, ep: e.target.value })} />
                    {sugErr.ep && <div className="error-msg">Required</div>}
                  </div>
                  <div className="field">
                    <label>Speaker</label>
                    <input placeholder="e.g. Kunal Shah" value={sugForm.speaker} className={sugErr.speaker ? "field-error" : ""} onChange={(e) => setSugForm({ ...sugForm, speaker: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>The quote</label>
                    <textarea placeholder="What did Nikhil say?" value={sugForm.quote} className={sugErr.quote ? "field-error" : ""} onChange={(e) => setSugForm({ ...sugForm, quote: e.target.value })} />
                    {sugErr.quote && <div className="error-msg">Required</div>}
                  </div>
                  <div className="field">
                    <label>Why it matters (optional)</label>
                    <textarea placeholder="What's the key insight here?" value={sugForm.context} onChange={(e) => setSugForm({ ...sugForm, context: e.target.value })} style={{ minHeight: 60 }} />
                  </div>
                  <div className="field">
                    <label>Your name (optional)</label>
                    <input placeholder="e.g. Rahul" value={sugForm.name} onChange={(e) => setSugForm({ ...sugForm, name: e.target.value })} />
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

      {/* Auth Modal */}
      {showAuth && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowAuth(false)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-head">
              <div className="modal-title">Admin access</div>
              <button className="modal-close" onClick={() => { setShowAuth(false); setAuthErr(false); }}>&#215;</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Password</label>
                <input type="password" ref={passRef} placeholder="Enter password" className={authErr ? "field-error" : ""} onKeyDown={(e) => e.key === "Enter" && checkAuth()} autoFocus />
                {authErr && <div className="error-msg">Incorrect password.</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => { setShowAuth(false); setAuthErr(false); }}>Cancel</button>
              <button className="btn btn-solid" onClick={checkAuth}>Unlock</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdmin && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowAdmin(false)}>
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">
                Admin
                {pendingSuggestions.length > 0 && (
                  <span className="neo-badge-accent">
                    {pendingSuggestions.length} suggestion{pendingSuggestions.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <button className="modal-close" onClick={() => setShowAdmin(false)}>&#215;</button>
            </div>
            <div className="modal-body">
              <div className="tabs">
                <button className={`tab-btn${adminSubTab === "add" ? " active" : ""}`} onClick={() => setAdminSubTab("add")}>Add Insights</button>
                <button className={`tab-btn${adminSubTab === "suggestions" ? " active" : ""}`} onClick={() => setAdminSubTab("suggestions")}>
                  Suggestions {pendingSuggestions.length > 0 && `(${pendingSuggestions.length})`}
                </button>
                <button className={`tab-btn${adminSubTab === "database" ? " active" : ""}`} onClick={() => setAdminSubTab("database")}>
                  Database
                </button>
              </div>

              {adminSubTab === "add" && (
                <>
                  <div className="tabs" style={{ marginTop: -10 }}>
                    <button className={`tab-btn${adminTab === "ai" ? " active" : ""}`} onClick={() => setAdminTab("ai")}>AI Extract</button>
                    <button className={`tab-btn${adminTab === "manual" ? " active" : ""}`} onClick={() => setAdminTab("manual")}>Manual</button>
                  </div>

                  {adminTab === "ai" && (
                    <div>
                      <div className="ai-panel">
                        <div className="ai-panel-title">&#9733; How to get the transcript</div>
                        <div className="ai-steps">
                          1. Open the episode on <a href="https://www.youtube.com/@nikhilkamathcio" target="_blank" rel="noreferrer">YouTube</a><br />
                          2. Click <strong>&#8943; More</strong> below the video &#8594; <strong>Show transcript</strong><br />
                          3. Select all the text, copy, paste below
                        </div>
                      </div>
                      <div className="ep-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input placeholder="Episode name — e.g. WTF is Investing?" value={epName} onChange={(e) => setEpName(e.target.value)} />
                        <input placeholder="YouTube URL — e.g. https://youtu.be/abc123" value={epVideoUrl} onChange={(e) => setEpVideoUrl(e.target.value)} />
                      </div>
                      <textarea className="transcript-box" placeholder="Paste the YouTube transcript here..." value={transcript} onChange={(e) => setTranscript(e.target.value)} />
                      {extractErr && <div className="error-msg" style={{ marginBottom: 10 }}>{extractErr}</div>}
                      <button className="btn btn-accent" style={{ width: "100%" }} onClick={handleExtract} disabled={extracting}>
                        {extracting ? "Extracting..." : "Extract insights with AI"}
                      </button>
                      {extracting && <div className="ai-loading" style={{ marginTop: 14 }}><div className="spinner" />Reading transcript...</div>}
                      {extracted.length > 0 && (
                        <div style={{ marginTop: 18 }}>
                          <div className="divider" />
                          <div className="select-all-row">
                            <span className="select-all-label" onClick={() => setSelected(selected.length === extracted.length ? [] : extracted.map((_, i) => i))}>
                              {selected.length === extracted.length ? "Deselect all" : "Select all"}
                            </span>
                            <span className="selected-count">{selected.length} selected</span>
                          </div>
                          <div className="extracted-list">
                            {extracted.map((ins, i) => (
                              <div className={`extracted-card topic-${ins.topic.toLowerCase()}${selected.includes(i) ? " selected" : ""}`} key={i}>
                                <div className={`ext-check${selected.includes(i) ? " checked" : ""}`} onClick={() => setSelected((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])}>
                                  {selected.includes(i) && "✓"}
                                </div>
                                <div className="ext-body">
                                  {ins.speaker && <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'var(--accent-pink)', textTransform: 'uppercase', marginBottom: 6 }}>🗣 {ins.speaker}</div>}
                                  <div className="ext-quote">{ins.quote}</div>
                                  <div className="ext-takeaway">{ins.takeaway}</div>
                                  <div className="ext-meta">
                                    <select className="ext-topic" value={ins.topic} onChange={(e) => setExtracted((prev) => prev.map((item, idx) => idx === i ? { ...item, topic: e.target.value } : item))}>
                                      {TOPICS.map((t) => <option key={t}>{t}</option>)}
                                    </select>
                                    {ins.ts && <span className="ext-ts">{ins.ts}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {adminTab === "manual" && (
                    <div>
                      <div className="field">
                        <label>Episode title</label>
                        <input placeholder="e.g. WTF is Investing?" value={form.ep} className={formErr.ep ? "field-error" : ""} onChange={(e) => setForm({ ...form, ep: e.target.value })} />
                        {formErr.ep && <div className="error-msg">Required</div>}
                      </div>
                      <div className="field">
                        <label>Speaker</label>
                        <input placeholder="e.g. Kunal Shah" value={form.speaker} className={formErr.speaker ? "field-error" : ""} onChange={(e) => setForm({ ...form, speaker: e.target.value })} />
                        {formErr.speaker && <div className="error-msg">Required</div>}
                      </div>
                      <div className="field">
                        <label>Quote</label>
                        <textarea placeholder="Nikhil's exact words..." value={form.quote} className={formErr.quote ? "field-error" : ""} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
                        {formErr.quote && <div className="error-msg">Required</div>}
                      </div>
                      <div className="field">
                        <label>Key takeaway</label>
                        <textarea placeholder="What's the core insight?" value={form.takeaway} className={formErr.takeaway ? "field-error" : ""} onChange={(e) => setForm({ ...form, takeaway: e.target.value })} />
                        {formErr.takeaway && <div className="error-msg">Required</div>}
                      </div>
                      <div className="field">
                        <label>YouTube Video URL (optional, enables Watch Clip)</label>
                        <input placeholder="e.g. https://youtu.be/xXxXxXxXxXx" value={form.videoUrl || ""} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div className="field">
                          <label>Topic</label>
                          <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                            {TOPICS.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="field">
                          <label>Timestamp</label>
                          <input placeholder="e.g. 1:12:34" value={form.ts} onChange={(e) => setForm({ ...form, ts: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {adminSubTab === "suggestions" && (
                <div>
                  {pendingSuggestions.length === 0 ? (
                    <div className="empty-suggestions">No pending suggestions</div>
                  ) : (
                    pendingSuggestions.map((sug) => (
                      <div className="suggestion-item" key={sug.id}>
                        <div className="sug-quote">{sug.quote}</div>
                        <div className="sug-meta">
                          {sug.ep} {sug.name && `· submitted by ${sug.name}`} · {sug.date}
                        </div>
                        {sug.context && <div style={{ fontSize: 12, color: "var(--ink)", marginBottom: 8, fontWeight: 500 }}>{sug.context}</div>}
                        <div className="sug-actions">
                          <button className="btn btn-solid" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => approveSuggestion(sug)}>Publish</button>
                          <button className="btn" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => rejectSuggestion(sug.id)}>Dismiss</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {adminSubTab === "database" && (
                <div>
                  <div className={`storage-badge ${isFirebaseConfigured ? "cloud" : "local"}`}>
                    <span className="badge-dot" />
                    {isFirebaseConfigured ? "Connected to Cloud Firestore" : "Local Storage Mode (Offline)"}
                  </div>
                  
                  <div className="backup-section">
                    <h3>💾 Export Database</h3>
                    <p>Download the complete list of insights currently saved as a backup `.json` file.</p>
                    <button className="btn btn-solid" onClick={exportDatabase}>Export Insights (JSON)</button>
                  </div>

                  <div className="backup-section">
                    <h3>📥 Import Database</h3>
                    <p>Upload a previously exported `.json` file to restore or merge insights. This will sync automatically to Firestore if live.</p>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={importDatabase} 
                        style={{ 
                          position: "absolute", 
                          inset: 0, 
                          opacity: 0, 
                          cursor: "pointer", 
                          width: "100%", 
                          height: "100%" 
                        }} 
                      />
                      <button className="btn" style={{ pointerEvents: "none" }}>Select & Import File</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowAdmin(false)}>Close</button>
              {adminSubTab === "add" && adminTab === "ai" && extracted.length > 0 && (
                <button className="btn btn-solid" disabled={selected.length === 0} onClick={publishSelected}>
                  Publish {selected.length} insight{selected.length !== 1 ? "s" : ""}
                </button>
              )}
              {adminSubTab === "add" && adminTab === "manual" && (
                <button className="btn btn-solid" onClick={addInsight}>Publish</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* YouTube Video Modal */}
      {activeVideo && (
        <div className="video-modal-backdrop" onClick={() => setActiveVideo(null)}>
          <div className="video-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <div className="video-modal-title">▶ {activeVideo.title}</div>
              <button className="video-modal-close" onClick={() => setActiveVideo(null)}>✕</button>
            </div>
            <div className="video-modal-iframe-wrap">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.videoId}?start=${activeVideo.startSec}&autoplay=1&rel=0`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="video-modal-footer">
              Starting at {activeVideo.startSec}s · Click outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

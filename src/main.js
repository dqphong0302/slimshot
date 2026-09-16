import JSZip from 'jszip';
import { optimizeImage, LIMITS } from './optimize.js';

// DOM elements
const drop = document.getElementById('drop');
const fileInput = document.getElementById('fileInput');
const sampleBtn = document.getElementById('sampleBtn');
const notice = document.getElementById('notice');

// Controls
const controls = document.getElementById('controls');
const formatBtns = document.querySelectorAll('#fmtBtns button');
const qualityRange = document.getElementById('qualityRange');
const qualityVal = document.getElementById('qualityVal');
const resizeCheck = document.getElementById('resizeCheck');
const maxwInput = document.getElementById('maxwInput');
const reoptimizeBtn = document.getElementById('reoptimizeBtn');

// KPI Summary
const summary = document.getElementById('summary');
const sSaved = document.getElementById('sSaved');
const sPct = document.getElementById('sPct');
const sCount = document.getElementById('sCount');
const dlAllBtn = document.getElementById('dlAllBtn');

// Results container
const results = document.getElementById('results');

// Compare Modal
const modal = document.getElementById('modal');
const cmpSub = document.getElementById('cmpSub');
const cmpBase = document.getElementById('cmpBase');
const cmpAfter = document.getElementById('cmpAfter');
const cmpAfterWrap = document.getElementById('cmpAfterWrap');
const cmpHandle = document.getElementById('cmpHandle');
const cmpBox = document.getElementById('cmpBox');
const modalCloses = document.querySelectorAll('[data-close]');

// App State
let selectedFormat = 'auto';
let items = []; // Array of { file, el, result, url, baseUrl }
let isRunning = false;

function showToast(message, type = 'info') {
  if (window.PDUI && window.PDUI.Toast && typeof window.PDUI.Toast.show === 'function') {
    window.PDUI.Toast.show(message, type);
  }
}

function showNotice(msg) {
  if (!notice) return;
  notice.textContent = msg;
  notice.classList.add('show');
  setTimeout(() => notice.classList.remove('show'), 6000);
}

function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function baseName(name) {
  return name.replace(/\.[^.]+$/, '');
}

function getOptions() {
  return {
    format: selectedFormat,
    quality: parseInt(qualityRange.value, 10) / 100,
    resize: resizeCheck.checked,
    maxw: parseInt(maxwInput.value, 10) || 2000
  };
}

// ---------------------------------------------------------------------------
// Format & Control Listeners
// ---------------------------------------------------------------------------

formatBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    formatBtns.forEach((b) => b.classList.remove('on'));
    btn.classList.add('on');
    selectedFormat = btn.dataset.v;
  });
});

qualityRange.addEventListener('input', () => {
  qualityVal.textContent = `${qualityRange.value}%`;
});

reoptimizeBtn.addEventListener('click', () => {
  items.forEach((it) => {
    it.result = null;
  });
  runQueue();
});

// ---------------------------------------------------------------------------
// File Handling & Queue
// ---------------------------------------------------------------------------

function acceptFiles(files) {
  const fileArray = Array.from(files).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));

  if (fileArray.length === 0) {
    showNotice('Chỉ hỗ trợ các định dạng hình ảnh JPG, PNG hoặc WebP.');
    showToast('Vui lòng chọn ảnh JPG, PNG hoặc WebP.', 'error');
    return;
  }

  const msgs = [];
  let toAdd = fileArray;

  if (items.length + toAdd.length > LIMITS.maxFiles) {
    const allowed = Math.max(0, LIMITS.maxFiles - items.length);
    msgs.push(`Tối đa ${LIMITS.maxFiles} ảnh/lượt — đã lấy ${allowed} ảnh đầu tiên.`);
    toAdd = toAdd.slice(0, allowed);
  }

  const validFiles = [];
  let totalCurrentSize = items.reduce((sum, i) => sum + i.file.size, 0);

  for (const f of toAdd) {
    if (f.size > LIMITS.maxFileSize) {
      msgs.push(`Ảnh "${f.name}" (${fmtBytes(f.size)}) vượt giới hạn ${LIMITS.maxFileSize / (1024 * 1024)}MB — đã bỏ qua.`);
      continue;
    }
    if (totalCurrentSize + f.size > LIMITS.totalBatchSize) {
      msgs.push(`Tổng dung lượng vượt quá ${LIMITS.totalBatchSize / (1024 * 1024)}MB — dừng thêm ảnh.`);
      break;
    }
    totalCurrentSize += f.size;
    validFiles.push(f);
  }

  if (msgs.length > 0) {
    showNotice(msgs.join(' '));
  }

  if (validFiles.length === 0) return;

  controls.classList.add('show');
  validFiles.forEach(addItem);
  showToast(`Đã nhận ${validFiles.length} hình ảnh vào SlimShot.`, 'info');
  runQueue();
}

function addItem(file) {
  const el = document.createElement('div');
  el.className = 'cs-item-card working';
  el.innerHTML = `
    <img class="cs-item-thumb" alt="Thumbnail" />
    <div class="cs-item-meta">
      <div class="cs-item-name">${file.name}</div>
      <div class="cs-item-szline">
        <span class="cs-sz-orig">${fmtBytes(file.size)}</span>
        <span class="cs-sz-arrow">→</span>
        <span class="cs-sz-proc"><span class="cs-spin"></span> Đang nén...</span>
      </div>
    </div>
    <div class="cs-item-acts">
      <button class="cs-icon-btn cmp-btn" title="So sánh trước / sau">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v18"></path><path d="m8 6-4 4 4 4"></path><path d="m16 18 4-4-4-4"></path>
        </svg>
      </button>
      <button class="cs-icon-btn dl-btn" title="Tải ảnh này về">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v12"></path><path d="m8 11 4 4 4-4"></path><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path>
        </svg>
      </button>
    </div>
  `;

  results.appendChild(el);

  const it = {
    file,
    el,
    result: null,
    url: null,
    baseUrl: URL.createObjectURL(file)
  };

  el.querySelector('.cs-item-thumb').src = it.baseUrl;
  items.push(it);

  el.querySelector('.cmp-btn').addEventListener('click', () => openCompare(it));
  el.querySelector('.dl-btn').addEventListener('click', () => downloadItem(it));
}

async function runQueue() {
  if (isRunning) return;
  isRunning = true;

  for (const it of items) {
    if (!it.result) {
      await processItem(it);
    }
  }

  isRunning = false;
  updateSummary();
}

async function processItem(it) {
  it.el.classList.add('working');
  const proc = it.el.querySelector('.cs-sz-proc');
  proc.innerHTML = `<span class="cs-spin"></span> Đang nén...`;

  try {
    const r = await optimizeImage(it.file, getOptions());
    it.result = r;
    if (it.url) URL.revokeObjectURL(it.url);
    it.url = URL.createObjectURL(r.bestBlob);

    const isFmtChanged = r.bestType !== r.srcType;
    const isResized = r.origW !== r.w || r.origH !== r.h;

    let html = `<span class="cs-sz-new">${fmtBytes(r.newSize)}</span>`;

    if (r.kept) {
      html += ` <span class="cs-badge badge-same">Đã tối ưu sẵn</span>`;
    } else {
      html += ` <span class="cs-badge badge-save">-${r.percentSaved}%</span>`;
    }

    if (isFmtChanged) {
      html += ` <span class="cs-badge badge-fmt">${r.bestExt.toUpperCase()}</span>`;
    }

    if (isResized) {
      html += ` <span class="cs-badge badge-dim">${r.w}×${r.h}</span>`;
    }

    proc.innerHTML = html;
  } catch (err) {
    console.error('Compression error:', err);
    proc.innerHTML = `<span class="cs-err-text">Lỗi: ${err.message || 'Xử lý thất bại'}</span>`;
  } finally {
    it.el.classList.remove('working');
  }
}

function updateSummary() {
  const done = items.filter((i) => i.result);
  if (done.length === 0) {
    summary.classList.remove('show');
    return;
  }

  let totalOrig = 0;
  let totalNew = 0;

  done.forEach((i) => {
    totalOrig += i.result.origSize;
    totalNew += i.result.newSize;
  });

  const saved = Math.max(0, totalOrig - totalNew);
  const avgPct = totalOrig > 0 ? Math.round(((totalOrig - totalNew) / totalOrig) * 100) : 0;

  sSaved.textContent = fmtBytes(saved);
  sPct.textContent = `${avgPct}%`;
  sCount.textContent = `${done.length} ảnh`;
  summary.classList.add('show');
}

// ---------------------------------------------------------------------------
// Downloads
// ---------------------------------------------------------------------------

function downloadItem(it) {
  if (!it.result) return;
  const a = document.createElement('a');
  a.href = it.url;
  a.download = `${baseName(it.file.name)}-slim.${it.result.bestExt}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

dlAllBtn.addEventListener('click', async () => {
  const done = items.filter((i) => i.result);
  if (done.length === 0) return;

  dlAllBtn.disabled = true;
  const originalText = dlAllBtn.innerHTML;
  dlAllBtn.innerHTML = `<span class="cs-spin"></span> Đang nén file .zip...`;

  try {
    const zip = new JSZip();
    const usedNames = {};

    for (const it of done) {
      let name = `${baseName(it.file.name)}.${it.result.bestExt}`;
      if (usedNames[name]) {
        name = `${baseName(it.file.name)}-${usedNames[name]++}.${it.result.bestExt}`;
      } else {
        usedNames[name] = 1;
      }
      zip.file(name, it.result.bestBlob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = zipUrl;
    a.download = 'slimshot-bundle.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(zipUrl), 10000);

    showToast(`Đã tải về thành công gói zip (${fmtBytes(zipBlob.size)})!`, 'success');
  } catch (err) {
    console.error('Zip generation error:', err);
    showNotice(`Lỗi tạo file zip: ${err.message}`);
    showToast('Lỗi khi tạo gói .zip.', 'error');
  } finally {
    dlAllBtn.disabled = false;
    dlAllBtn.innerHTML = originalText;
  }
});

// ---------------------------------------------------------------------------
// Compare Modal Slider (Interactive Split View)
// ---------------------------------------------------------------------------

function openCompare(it) {
  if (!it.result) return;

  cmpBase.src = it.baseUrl;
  cmpAfter.src = it.url;
  cmpSub.innerHTML = `<b>${it.file.name}</b> · Gốc: <b>${fmtBytes(it.result.origSize)}</b> (${it.result.origW}×${it.result.origH}) → Đã nén: <b>${fmtBytes(it.result.newSize)}</b> (${it.result.w}×${it.result.h})`;

  modal.classList.add('show');
  setSliderPosition(50);
}

function closeCompare() {
  modal.classList.remove('show');
}

modalCloses.forEach((btn) => {
  btn.addEventListener('click', closeCompare);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('show')) {
    closeCompare();
  }
});

function setSliderPosition(pct) {
  const p = Math.max(0, Math.min(100, pct));
  cmpAfterWrap.style.clipPath = `polygon(${p}% 0, 100% 0, 100% 100%, ${p}% 100%)`;
  cmpHandle.style.left = `${p}%`;
}

let isDragging = false;
function onDrag(e) {
  if (!isDragging) return;
  const rect = cmpBox.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const pos = ((clientX - rect.left) / rect.width) * 100;
  setSliderPosition(pos);
}

cmpBox.addEventListener('mousedown', (e) => {
  isDragging = true;
  onDrag(e);
});
cmpBox.addEventListener('touchstart', (e) => {
  isDragging = true;
  onDrag(e);
}, { passive: true });

window.addEventListener('mousemove', onDrag);
window.addEventListener('touchmove', onDrag, { passive: true });

window.addEventListener('mouseup', () => { isDragging = false; });
window.addEventListener('touchend', () => { isDragging = false; });

// ---------------------------------------------------------------------------
// Drag and Drop Zone
// ---------------------------------------------------------------------------

drop.addEventListener('click', () => fileInput.click());
drop.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

drop.addEventListener('dragover', (e) => {
  e.preventDefault();
  drop.classList.add('over');
});

drop.addEventListener('dragleave', () => {
  drop.classList.remove('over');
});

drop.addEventListener('drop', (e) => {
  e.preventDefault();
  drop.classList.remove('over');
  if (e.dataTransfer && e.dataTransfer.files) {
    acceptFiles(e.dataTransfer.files);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files) {
    acceptFiles(fileInput.files);
    fileInput.value = '';
  }
});

// Sample Image Generator
sampleBtn.addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  // Draw colorful high-res gradient and patterns
  const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
  grad.addColorStop(0, '#1e40af');
  grad.addColorStop(0.5, '#4f46e5');
  grad.addColorStop(1, '#0284c7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1920, 1080);

  // Add geometric shapes
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 1920, Math.random() * 1080, Math.random() * 200 + 40, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SlimShot — Sample Test Image', 960, 520);
  ctx.font = '36px sans-serif';
  ctx.fillText('1920 × 1080 • HD Demo Graphic', 960, 590);

  canvas.toBlob((blob) => {
    if (blob) {
      const sampleFile = new File([blob], 'sample-wallpaper-1080p.jpg', { type: 'image/jpeg' });
      acceptFiles([sampleFile]);
    }
  }, 'image/jpeg', 0.95);
});

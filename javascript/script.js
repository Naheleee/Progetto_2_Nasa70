class GridManager {
  constructor(options = {}) {
    this.scrollX = 0;
    this.scrollY = 0;
    this.velocity = {
      x: 0,
      y: 0
    };
    this.isAnimating = false;
    this.bounds = {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0
    };
    this.containerDimensions = {
      width: 0,
      height: 0
    };
    this.contentDimensions = {
      width: 0,
      height: 0
    };
    this.isDragging = false;
    this.dragStart = {
      x: 0,
      y: 0
    };
    this.dragOffset = {
      x: 0,
      y: 0
    };
    this.tagSpacing = 30;
    this.rowHeight = 50;
    this.radar = document.getElementById('radar');
    this.radarCanvas = document.getElementById('radar-canvas');
    this.labelsX = document.getElementById('labels-x');
    this.scrollWrapper = document.getElementById('scroll-wrapper');
    this.syncScheduled = false;
    this.init();
  }
  init() {
    this.updateSpacingFromCSS();
    this.updateBoundaries();
    this.setupEventListeners();
  }
  updateSpacingFromCSS() {
    const rootStyles = getComputedStyle(document.documentElement);
    this.tagSpacing = parseInt(rootStyles.getPropertyValue('--tag-spacing')) || 30;
    this.rowHeight = parseInt(rootStyles.getPropertyValue('--row-height')) || 30;
  }
  updateBoundaries() {
    if (!this.radar || !this.radarCanvas) return;
    this.containerDimensions.width = this.radar.offsetWidth;
    this.containerDimensions.height = this.radar.offsetHeight;
    this.contentDimensions.width = Math.max(
      this.containerDimensions.width,
      filteredProjects.length > 0 ? visibleTags.length * this.tagSpacing : 0
    );
    this.contentDimensions.height = Math.max(
      this.containerDimensions.height,
      this.rowHeight + (filteredProjects.length * this.rowHeight)
    );
    this.bounds.maxX = 0;
    this.bounds.minX = this.containerDimensions.width > this.contentDimensions.width ?
      0 :
      -(this.contentDimensions.width - this.containerDimensions.width);
    this.bounds.maxY = 0;
    this.bounds.minY = this.containerDimensions.height > this.contentDimensions.height ?
      0 :
      -(this.contentDimensions.height - this.containerDimensions.height);
    this.radarCanvas.style.width = `${this.contentDimensions.width}px`;
    this.radarCanvas.style.height = `${this.contentDimensions.height}px`;
    this.scrollX = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.scrollX));
    this.scrollY = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.scrollY));
  }
  setScroll(x, y) {
    this.scrollX = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, x));
    this.scrollY = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, y));
    this.syncUI();
  }
  syncUI() {
    this.radarCanvas.style.transform = `translate(${this.scrollX}px, ${this.scrollY}px)`;
    this.labelsX.style.transform = `translateX(${this.scrollX}px)`;
    const projectList = document.getElementById('left-bottom');
    if (projectList) {
      projectList.style.transform = `translateY(${this.scrollY}px)`;
    }
  }
  setupEventListeners() {
    this.radar.addEventListener('wheel', (e) => this.handleWheel(e), {
      passive: false
    });
    const leftBottom = document.getElementById('left-bottom');
    if (leftBottom) {
      leftBottom.addEventListener('wheel', (e) => this.handleWheel(e), {
        passive: false
      });
    }
    this.radar.addEventListener('mousedown', (e) => this.handleMouseDown(e), false);
    if (leftBottom) {
      leftBottom.addEventListener('mousedown', (e) => this.handleMouseDown(e), false);
    }
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e), false);
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e), false);
    this.scrollWrapper.addEventListener('scroll', (e) => this.handleScrollWrapperScroll(e), false);
    window.addEventListener('resize', () => {
      this.updateSpacingFromCSS();
      this.updateBoundaries();
      this.syncUI();
    });
  }
  handleWheel(event) {
    event.preventDefault();
    let deltaX = event.deltaX;
    let deltaY = event.deltaY;
    if (event.deltaMode === 1) {
      deltaX *= this.rowHeight;
      deltaY *= this.rowHeight;
    } else if (event.deltaMode === 2) {
      deltaX *= this.containerDimensions.width;
      deltaY *= this.containerDimensions.height;
    }
    const newScrollX = this.scrollX - deltaX;
    const newScrollY = this.scrollY - deltaY;
    this.setScroll(newScrollX, newScrollY);
    this.velocity.x = -deltaX * 0.1;
    this.velocity.y = -deltaY * 0.1;
  }
  handleMouseDown(event) {
    this.isDragging = true;
    this.dragStart.x = event.clientX;
    this.dragStart.y = event.clientY;
    this.dragOffset.x = this.scrollX;
    this.dragOffset.y = this.scrollY;
    this.radar.classList.add('dragging');
    const leftBottom = document.getElementById('left-bottom');
    if (leftBottom) {
      leftBottom.style.cursor = 'grabbing';
    }
    this.velocity.x = 0;
    this.velocity.y = 0;
    event.preventDefault();
  }
  handleMouseMove(event) {
    if (!this.isDragging) return;
    const deltaX = event.clientX - this.dragStart.x;
    const deltaY = event.clientY - this.dragStart.y;
    const newScrollX = this.dragOffset.x + deltaX;
    const newScrollY = this.dragOffset.y + deltaY;
    this.setScroll(newScrollX, newScrollY);
  }
  handleMouseUp(event) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.radar.classList.remove('dragging');
    const leftBottom = document.getElementById('left-bottom');
    if (leftBottom) {
      leftBottom.style.cursor = 'grab';
    }
  }
  handleScrollWrapperScroll(event) {
    if (!this.isDragging) {
      const newScrollY = -this.scrollWrapper.scrollTop;
      this.scrollY = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, newScrollY));
      this.radarCanvas.style.transform = `translate(${this.scrollX}px, ${this.scrollY}px)`;
      this.labelsX.style.transform = `translateX(${this.scrollX}px)`;
    }
  }
}
const API_URL = "https://ixd-supsi.github.io/n70api/data.json";
const IMG_BASE = "https://ixd-supsi.github.io/n70api/immagini/";
let allProjects = [];
let filteredProjects = [];
let allowedTags = [];
let visibleTags = [];
let selectedIndex = 0;
let hasStartedNavigating = false;
let autoScrollInterval = null;
let autoScrollTimeout = null;
let currentlyShowingIndex = -1;
let selectedTag = null;
let gridManager = null;
let hoveredIndex = -1;
let currentSort = {
  column: 'titolo',
  direction: 'asc',
  active: true
};

function extractTagsFromProjects() {
  const tagsSet = new Set();
  allProjects.forEach(project => {
    if (project.tags && Array.isArray(project.tags)) {
      project.tags.forEach(tag => {
        tagsSet.add(tag);
      });
    }
  });
  allowedTags = Array.from(tagsSet).sort();
  allowedTags.push('');
  visibleTags = [...allowedTags];
}

function updateVisibleTags() {
  if (hasStartedNavigating && filteredProjects[selectedIndex]) {
    const project = filteredProjects[selectedIndex];
    const projectTags = (project.tags || []).map(t => t.toLowerCase()).sort();
    visibleTags = allowedTags.filter(tag => {
      if (tag === '') return true;
      return projectTags.includes(tag.toLowerCase());
    });
  } else {
    visibleTags = [...allowedTags];
  }
}

function sortData() {
  if (!currentSort.active) return;
  allProjects.sort((a, b) => {
    let valA, valB;
    if (currentSort.column === 'anno') {
      valA = a.data ? (a.data.anno * 10000 + a.data.mese * 100 + a.data.giorno) : (a.anno || 0);
      valB = b.data ? (b.data.anno * 10000 + b.data.mese * 100 + b.data.giorno) : (b.anno || 0);
    } else {
      valA = (a[currentSort.column] || "").toString().toLowerCase();
      valB = (b[currentSort.column] || "").toString().toLowerCase();
    }
    if (currentSort.direction === 'asc') return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });
}

function sortBy(column) {
  if (currentSort.column === column && currentSort.active) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.column = column;
    currentSort.direction = 'asc';
    currentSort.active = true;
  }
  sortData();
  applyFilter();
  updateAndRender();
}

function setupGridLabelsX() {
  const lx = document.getElementById('labels-x');
  lx.innerHTML = visibleTags.map(t => `<span class="tag-label" data-tag="${t}">${t}</span>`).join('');
  document.querySelectorAll('.tag-label').forEach(span => {
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = span.dataset.tag;
      handleTagClick(tag);
    });
  });
}

function handleTagClick(tag) {
  if (selectedTag === tag) {
    selectedTag = null;
  } else {
    selectedTag = tag;
  }
  document.querySelectorAll('.tag-label').forEach(span => {
    if (span.dataset.tag === selectedTag) {
      span.classList.add('active');
    } else {
      span.classList.remove('active');
    }
  });
  applyFilter();
  updateAndRender();
}

function applyFilter() {
  if (selectedTag === null) {
    filteredProjects = [...allProjects];
  } else {
    filteredProjects = allProjects.filter(p => {
      const projectTags = (p.tags || []).map(t => t.toLowerCase());
      return projectTags.includes(selectedTag.toLowerCase());
    });
  }
}

function updateAndRender() {
  if (selectedIndex >= filteredProjects.length) selectedIndex = 0;
  renderList();
  renderRadar();
  updateDetail();
  if (gridManager) {
    gridManager.updateBoundaries();
    gridManager.syncUI();
  }
}

function renderList() {
  const listContainer = document.getElementById('project-list');
  ['titolo', 'autore', 'anno'].forEach(col => {
    const arrow = document.getElementById(`arrow-${col}`);
    if (currentSort.column === col) {
      arrow.style.display = "inline-block";
      arrow.className = `sort-arrow ${currentSort.direction === 'asc' ? 'down' : 'up'}`;
    } else {
      arrow.style.display = "none";
    }
  });
  listContainer.innerHTML = filteredProjects.map((p, i) => {
    let dateFormatted = '';
    if (p.data && p.data.anno) {
      if (p.data.giorno && p.data.mese) {
        dateFormatted =
          `${String(p.data.giorno).padStart(2, '0')}/${String(p.data.mese).padStart(2, '0')}/${p.data.anno}`;
      } else {
        dateFormatted = p.data.anno;
      }
    } else if (p.anno) {
      dateFormatted = p.anno;
    }
    return `
      <div class="project-item ${(hasStartedNavigating && i === selectedIndex) ? 'selected' : ''} ${hoveredIndex === i ? 'hovered' : ''}" onclick="handleMouseSelect(${i})" onmouseenter="handleProjectHoverEnter(${i})" onmouseleave="handleProjectHoverLeave()">
        <span class="project-title col-title">${p.titolo}</span>
        <span class="project-author col-author">${p.autore}</span>
        <span class="project-date col-date">${dateFormatted}</span>
        <span class="project-link col-link" onclick="event.stopPropagation(); openProject('${p.url}')">-></span>
      </div>
    `
  }).join('');
  const selectedEl = listContainer.querySelector('.selected');
  if (selectedEl) selectedEl.scrollIntoView({
    block: 'nearest',
    behavior: 'smooth'
  });
}

function renderRadar() {
  const radarCanvas = document.getElementById('radar-canvas');
  const svg = document.getElementById('radar-connections');
  const highlightSvg = document.getElementById('highlight-column');
  const dots = radarCanvas.querySelectorAll('.grid-dot');
  dots.forEach(d => d.remove());
  svg.innerHTML = '';
  highlightSvg.innerHTML = '';
  const TAG_SPACING = gridManager ? gridManager.tagSpacing : 30;
  const ROW_HEIGHT = gridManager ? gridManager.rowHeight : 30;
  if (selectedTag !== null) {
    const tagIndex = visibleTags.findIndex(t => t.toLowerCase() === selectedTag.toLowerCase());
    if (tagIndex !== -1) {
      const xPos = tagIndex * TAG_SPACING;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", xPos + 15);
      line.setAttribute("y1", "0");
      line.setAttribute("x2", xPos + 15);
      line.setAttribute("y2", "50000");
      line.setAttribute("stroke", "white");
      line.setAttribute("stroke-width", "4");
      line.setAttribute("fill", "none");
      line.setAttribute("stroke-dasharray", "5");
      highlightSvg.appendChild(line);
    }
  }
  const occupancy = {};
  filteredProjects.forEach((p, i) => {
    const isSelected = (hasStartedNavigating && i === selectedIndex);
    const isHovered = (hoveredIndex === i);
    const tagsToMap = (p.tags || []).filter(t => visibleTags.some(allowed => allowed.toLowerCase() === t
      .toLowerCase()));
    const tagsToProcess = tagsToMap.length > 0 ? tagsToMap : [visibleTags.filter(t => t !== '')[0]];
    const coords = [];
    tagsToProcess.forEach(tagString => {
      const xIndex = visibleTags.findIndex(t => t.toLowerCase() === tagString.toLowerCase());
      const xPos = (xIndex !== -1) ? xIndex * TAG_SPACING : 0;
      const yPos = (i * ROW_HEIGHT) + (ROW_HEIGHT / 2);
      const cellKey = `${xIndex}-${i}`;
      if (!occupancy[cellKey]) occupancy[cellKey] = 0;
      const pixelOffset = occupancy[cellKey] * 12;
      occupancy[cellKey]++;
      const dot = document.createElement('div');
      dot.className = `grid-dot ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`;
      dot.style.left = `${xPos}px`;
      dot.style.top = `${yPos + pixelOffset}px`;
      dot.onclick = (e) => {
        e.stopPropagation();
        handleMouseSelect(i);
      };
      radarCanvas.appendChild(dot);
      if (isSelected || isHovered) coords.push({
        x: xPos,
        y: yPos
      });
    });
    if ((isSelected || isHovered) && coords.length > 1) {
      coords.sort((a, b) => a.x - b.x);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      line.setAttribute("points", coords.map(c => `${c.x+15},${c.y}`).join(' '));
      line.setAttribute("stroke", "white");
      line.setAttribute("stroke-width", "4");
      line.setAttribute("fill", "none");
      line.setAttribute("stroke-dasharray", "5");
      svg.appendChild(line);
    }
  });
}

function updateDetail() {
  const detailPanel = document.getElementById('project-detail');
  const imgContainer = document.getElementById('detail-image-container');
  const infoContainer = document.getElementById('detail-info');
  const project = filteredProjects[selectedIndex];

  if (!project || !hasStartedNavigating) {
    if (hoveredIndex === -1) {
      detailPanel.style.display = 'none';
      currentlyShowingIndex = -1;
      if (autoScrollInterval) clearInterval(autoScrollInterval);
      if (autoScrollTimeout) clearTimeout(autoScrollTimeout);
    }
    return;
  }

  if (currentlyShowingIndex === selectedIndex) {
    detailPanel.style.display = 'flex';
    return;
  }

  if (autoScrollInterval) clearInterval(autoScrollInterval);
  if (autoScrollTimeout) clearTimeout(autoScrollTimeout);
  currentlyShowingIndex = selectedIndex;

  detailPanel.style.display = 'flex';
  imgContainer.innerHTML = `<img src="${IMG_BASE}${project.immagine[1]}" alt="${project.titolo}">`;
  infoContainer.innerHTML = `
    <div class="detail-t">${project.titolo}</div>
    <div class="detail-a">${project.autore}</div>
    <div class="detail-d-scroll">${project.descrizione || 'Nessuna descrizione disponibile.'}</div>
   `;
  const scrollEl = infoContainer.querySelector('.detail-d-scroll');
  if (scrollEl) startAutoScroll(scrollEl);
}

function startAutoScroll(el) {
  el.scrollTop = 0;
  autoScrollTimeout = setTimeout(() => {
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;
    let direction = 1;
    autoScrollInterval = setInterval(() => {
      if (direction === 1) {
        el.scrollTop += 0.5;
        if (el.scrollTop >= maxScroll) {
          el.scrollTop = maxScroll;
          direction = 0;
          autoScrollTimeout = setTimeout(() => direction = -1, 4000);
        }
      } else if (direction === -1) {
        el.scrollTop -= 0.5;
        if (el.scrollTop <= 0) {
          el.scrollTop = 0;
          direction = 0;
          autoScrollTimeout = setTimeout(() => direction = 1, 4000);
        }
      }
    }, 30);
  }, 4000);
}

function handleMouseSelect(index) {
  if (hasStartedNavigating && selectedIndex === index) {
    hasStartedNavigating = false;
  } else {
    hasStartedNavigating = true;
    selectedIndex = index;
  }
  hoveredIndex = -1;
  updateVisibleTags();
  setupGridLabelsX();
  updateAndRender();
}

function openProject(url) {
  if (url) {
    window.open(url, '_blank');
  }
}

function handleProjectHoverEnter(index) {
  if (hasStartedNavigating && selectedIndex === index) return;
  hoveredIndex = index;
  displayHoverDetail(index);
  renderRadar();
}

function handleProjectHoverLeave() {
  if (hasStartedNavigating && selectedIndex === hoveredIndex) return;
  hoveredIndex = -1;
  clearHoverDetail();
  renderRadar();
}

function handleDotHoverEnter(index) {
  if (hasStartedNavigating && selectedIndex === index) return;
  hoveredIndex = index;
  displayHoverDetail(index);
  renderRadar();
}

function handleDotHoverLeave() {
  if (hasStartedNavigating && selectedIndex === hoveredIndex) return;
  hoveredIndex = -1;
  clearHoverDetail();
  renderRadar();
}

function displayHoverDetail(index) {
  const detailPanel = document.getElementById('project-detail');
  const imgContainer = document.getElementById('detail-image-container');
  const infoContainer = document.getElementById('detail-info');
  const project = filteredProjects[index];
  if (!project) return;

  if (currentlyShowingIndex === index) {
    return;
  }

  if (autoScrollInterval) clearInterval(autoScrollInterval);
  if (autoScrollTimeout) clearTimeout(autoScrollTimeout);
  currentlyShowingIndex = index;

  detailPanel.style.display = 'flex';
  imgContainer.innerHTML = `<img src="${IMG_BASE}${project.immagine[1]}" alt="${project.titolo}">`;
  infoContainer.innerHTML = `
    <div class="detail-t">${project.titolo}</div>
    <div class="detail-a">${project.autore}</div>
    <div class="detail-d-scroll">${project.descrizione || 'Nessuna descrizione disponibile.'}</div>
   `;
  const scrollEl = infoContainer.querySelector('.detail-d-scroll');
  if (scrollEl) startAutoScroll(scrollEl);
}

function clearHoverDetail() {
  if (!hasStartedNavigating) {
    const detailPanel = document.getElementById('project-detail');
    detailPanel.style.display = 'none';
    currentlyShowingIndex = -1;
    if (autoScrollInterval) clearInterval(autoScrollInterval);
    if (autoScrollTimeout) clearTimeout(autoScrollTimeout);
  } else {
    if (currentlyShowingIndex !== selectedIndex) {
      currentlyShowingIndex = -1;
      updateDetail();
    }
  }
}
async function init() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    allProjects = [...data, ...data, ...data];

    console.log("Progetti caricati correttamente. Totale:", allProjects.length);

    extractTagsFromProjects();

    sortData();

    setupGridLabelsX();
    applyFilter();

    gridManager = new GridManager();

    updateAndRender();

    const radarGrid = document.querySelector('.radar-grid');
    if (radarGrid) {
      radarGrid.addEventListener('mouseleave', () => {
        if (hasStartedNavigating && selectedIndex === hoveredIndex) return;
        hoveredIndex = -1;
        clearHoverDetail();
        renderRadar();
      });
    }
  } catch (error) {
    console.error("ERRORE NEL CARICAMENTO O DUPLICAZIONE:", error);
  }
}
window.addEventListener('keydown', (e) => {
  if (filteredProjects.length === 0) return;
  const key = e.key.toLowerCase();
  if (key === 'arrowdown' || key === 's') {
    e.preventDefault();
    if (!hasStartedNavigating) {
      hasStartedNavigating = true;
      selectedIndex = 0;
    } else if (selectedIndex < filteredProjects.length - 1) selectedIndex++;
    updateAndRender();
  } else if (key === 'arrowup' || key === 'w') {
    e.preventDefault();
    if (hasStartedNavigating) {
      if (selectedIndex > 0) selectedIndex--;
      else hasStartedNavigating = false;
    }
    updateAndRender();
  } else if (key === 'd' || key === 'arrowright' || key === 'enter') {
    if (hasStartedNavigating && filteredProjects[selectedIndex]) window.open(filteredProjects[selectedIndex]
      .url,
      '_blank');
  }
});
let aboutTypingTimeout;

function startAboutAnimation() {
  const descElement = document.querySelector('.about-description');
  const htmlContent = descElement.getAttribute('data-original-content');

  descElement.innerHTML = '';
  let i = 0;
  let isTag = false;
  let currentHTML = '';

  clearTimeout(aboutTypingTimeout);

  function type() {
    if (i < htmlContent.length) {
      let char = htmlContent.charAt(i);

      if (char === '<') isTag = true;

      currentHTML += char;
      descElement.innerHTML = currentHTML;
      i++;

      if (isTag) {
        if (char === '>') isTag = false;
        type();
      } else {
        aboutTypingTimeout = setTimeout(type, 1);
      }
    }
  }

  type();
}

function openAboutPage() {
  const aboutPage = document.getElementById('about-page');
  aboutPage.classList.remove('hidden');
  aboutPage.style.display = 'flex';
  startAboutAnimation();
}

function closeAboutPage() {
  const aboutPage = document.getElementById('about-page');
  aboutPage.classList.add('hidden');
  aboutPage.style.display = 'none';
  clearTimeout(aboutTypingTimeout);
}

document.addEventListener('DOMContentLoaded', () => {
  const aboutPage = document.getElementById('about-page');
  if (!aboutPage.classList.contains('hidden') && getComputedStyle(aboutPage).display !== 'none') {
    startAboutAnimation();
  }
});

init();
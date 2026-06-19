const PLANET_INFO = {
  Sun: { name: 'Sun (Surya)', emoji: '☀', color: '#ffd700', desc: 'Represents soul, father, authority, status, and leadership.', remedy: 'Offer fresh water to the rising Sun daily (Arghya).' },
  Moon: { name: 'Moon (Chandra)', emoji: '☾', color: '#bba6ce', desc: 'Represents mind, emotions, mother, peace, and intuition.', remedy: 'Drink water from a silver glass and practice meditation.' },
  Mars: { name: 'Mars (Mangal)', emoji: '♂', color: '#ef5b70', desc: 'Represents energy, courage, action, passion, and brothers.', remedy: 'Chant Hanuman Chalisa and fast on Tuesdays.' },
  Mercury: { name: 'Mercury (Budha)', emoji: '☿', color: '#36c98f', desc: 'Represents intellect, speech, commerce, logic, and maternal uncle.', remedy: 'Donate green clothes or feed green grass to cows on Wednesdays.' },
  Jupiter: { name: 'Jupiter (Guru)', emoji: '♃', color: '#f5b942', desc: 'Represents wisdom, wealth, spirituality, teacher, and growth.', remedy: 'Donate yellow items (dal, turmeric) or respect teachers on Thursdays.' },
  Venus: { name: 'Venus (Shukra)', emoji: '♀', color: '#ffffff', desc: 'Represents love, beauty, luxury, marriage, and artistic talent.', remedy: 'Chant Shukra Mantra and help needy girls on Fridays.' },
  Saturn: { name: 'Saturn (Shani)', emoji: '♄', color: '#7c3aed', desc: 'Represents karma, discipline, patience, hard work, and longevity.', remedy: 'Light a mustard oil lamp under a Peepal tree on Saturday evenings.' },
  Rahu: { name: 'Rahu', emoji: '☊', color: '#888888', desc: 'Represents ambition, illusion, sudden gains, and foreign travels.', remedy: 'Feed stray dogs or donate black sesame seeds on Saturdays.' },
  Ketu: { name: 'Ketu', emoji: '☋', color: '#a06040', desc: 'Represents liberation, spirituality, detachment, and sudden events.', remedy: 'Feed a black dog or perform charity for spiritual paths.' }
};

const SIGNS_SHORT = ['Mesh', 'Vrish', 'Mith', 'Kark', 'Sinh', 'Kanya', 'Tula', 'Vrishch', 'Dhanu', 'Makar', 'Kumbh', 'Meen'];

// Text positions for signs and planets in each of the 12 houses (1-indexed)
const HOUSE_COORDS = {
  1: { sign: { x: 150, y: 55 }, planets: { x: 150, y: 80, dx: 0, dy: 16 } },
  2: { sign: { x: 80, y: 35 }, planets: { x: 80, y: 55, dx: 0, dy: 16 } },
  3: { sign: { x: 35, y: 80 }, planets: { x: 45, y: 100, dx: 0, dy: 16 } },
  4: { sign: { x: 80, y: 145 }, planets: { x: 80, y: 170, dx: 0, dy: 16 } },
  5: { sign: { x: 35, y: 205 }, planets: { x: 45, y: 225, dx: 0, dy: 16 } },
  6: { sign: { x: 80, y: 260 }, planets: { x: 80, y: 240, dx: 0, dy: -16 } },
  7: { sign: { x: 150, y: 240 }, planets: { x: 150, y: 215, dx: 0, dy: -16 } },
  8: { sign: { x: 220, y: 260 }, planets: { x: 220, y: 240, dx: 0, dy: -16 } },
  9: { sign: { x: 265, y: 205 }, planets: { x: 255, y: 225, dx: 0, dy: 16 } },
  10: { sign: { x: 220, y: 145 }, planets: { x: 220, y: 170, dx: 0, dy: 16 } },
  11: { sign: { x: 265, y: 80 }, planets: { x: 255, y: 100, dx: 0, dy: 16 } },
  12: { sign: { x: 220, y: 35 }, planets: { x: 220, y: 55, dx: 0, dy: 16 } }
};

export const charts = {
  drawKundali(svgElement, chartData, onPlanetClick) {
    if (!svgElement || !chartData) return;
    
    // Clear previous drawing
    svgElement.innerHTML = '';
    
    // Create base container
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svgElement.appendChild(g);
    
    // Draw background grid lines (North Indian Chart)
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'ln');
    path.setAttribute('d', 'M0 0H300V300H0ZM150 0L300 150 150 300 0 150ZM0 0L300 300M300 0L0 300');
    g.appendChild(path);
    
    // Get Lagna sign index (1-12)
    const lagnaSignName = chartData.lagna.sign; // E.g., 'Mesh', 'Vrishabh'
    const SIGNS_FULL = ['Mesh', 'Vrishabh', 'Mithun', 'Kark', 'Singh', 'Kanya', 'Tula', 'Vrishchik', 'Dhanu', 'Makar', 'Kumbh', 'Meen'];
    const lagnaSignIndex = SIGNS_FULL.indexOf(lagnaSignName) + 1; // 1-12
    
    if (lagnaSignIndex === 0) {
      console.error('Invalid lagna sign', lagnaSignName);
      return;
    }
    
    // Render signs in each house
    for (let houseNum = 1; houseNum <= 12; houseNum++) {
      const signNum = ((lagnaSignIndex + houseNum - 2) % 12) + 1;
      const coords = HOUSE_COORDS[houseNum];
      
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', coords.sign.x);
      txt.setAttribute('y', coords.sign.y);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('font-size', '12px');
      txt.setAttribute('font-weight', 'bold');
      txt.setAttribute('fill', 'var(--gold)');
      txt.textContent = signNum;
      g.appendChild(txt);
    }
    
    // Group planets by house
    const housePlanets = {};
    for (let h = 1; h <= 12; h++) housePlanets[h] = [];
    
    chartData.planets.forEach(p => {
      if (p.house >= 1 && p.house <= 12) {
        housePlanets[p.house].push(p);
      }
    });
    
    // Render planets inside houses
    Object.keys(housePlanets).forEach(hStr => {
      const houseNum = Number(hStr);
      const planetsInHouse = housePlanets[houseNum];
      const coords = HOUSE_COORDS[houseNum];
      
      planetsInHouse.forEach((p, idx) => {
        const info = PLANET_INFO[p.body] || { emoji: '✦', color: 'var(--text)', name: p.body, desc: '', remedy: '' };
        
        // Calculate offsets to stack planets
        const px = coords.planets.x + (coords.planets.dx * idx);
        const py = coords.planets.y + (coords.planets.dy * idx);
        
        const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        textGroup.setAttribute('cursor', 'pointer');
        textGroup.setAttribute('class', 'chart-planet');
        
        // Click event listener
        textGroup.addEventListener('click', () => {
          if (onPlanetClick) {
            onPlanetClick(p, info);
          }
        });
        
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', px);
        txt.setAttribute('y', py);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('font-size', '11px');
        txt.setAttribute('font-weight', 'bold');
        txt.setAttribute('fill', info.color);
        txt.textContent = `${info.emoji} ${p.body.slice(0, 2)}`; // E.g. 'Su', 'Mo'
        
        // Tooltip title
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${info.name} in House ${houseNum} (${p.degree}°)`;
        txt.appendChild(title);
        
        textGroup.appendChild(txt);
        g.appendChild(textGroup);
      });
    });
    
    // Add central Lagna text
    const lagnaTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lagnaTxt.setAttribute('x', 150);
    lagnaTxt.setAttribute('y', 153);
    lagnaTxt.setAttribute('text-anchor', 'middle');
    lagnaTxt.setAttribute('font-size', '10px');
    lagnaTxt.setAttribute('font-weight', 'bold');
    lagnaTxt.setAttribute('fill', '#ffffff33');
    lagnaTxt.textContent = 'ASCENDANT';
    g.appendChild(lagnaTxt);
  },

  setupPinchZoom(svgElement) {
    if (!svgElement) return;
    let zoom = 1;
    let isPanning = false;
    let startX = 0, startY = 0;
    let translateX = 0, translateY = 0;
    
    svgElement.style.transformOrigin = 'center';
    svgElement.style.transition = 'transform 0.1s ease';
    
    // Zoom in/out via scroll
    svgElement.addEventListener('wheel', e => {
      e.preventDefault();
      zoom += e.deltaY * -0.001;
      zoom = Math.min(Math.max(0.75, zoom), 3);
      applyTransform();
    }, { passive: false });
    
    // Simple drag panning
    svgElement.addEventListener('mousedown', e => {
      isPanning = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      svgElement.style.cursor = 'grabbing';
    });
    
    window.addEventListener('mousemove', e => {
      if (!isPanning) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      applyTransform();
    });
    
    window.addEventListener('mouseup', () => {
      isPanning = false;
      svgElement.style.cursor = 'grab';
    });
    
    // Touch support (simple pinch)
    let initialDist = 0;
    svgElement.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        initialDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });
    
    svgElement.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && initialDist > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / initialDist;
        zoom = Math.min(Math.max(0.75, zoom * factor), 3);
        initialDist = dist;
        applyTransform();
      }
    });
    
    svgElement.addEventListener('touchend', () => {
      initialDist = 0;
    });

    function applyTransform() {
      svgElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoom})`;
    }
  }
};

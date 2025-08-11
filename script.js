// ========== CONFIG ==========
const API_KEY = '5a3884ac5835417f8c1141725251108';
const BASE = 'https://api.weatherapi.com/v1/current.json';

// ========== DOM ==========
const qInput = document.getElementById('q');
const searchBtn = document.getElementById('searchBtn');
const chips = document.querySelectorAll('.chip');
const iconImg = document.getElementById('icon');
const tempMain = document.getElementById('tempMain');
const condMain = document.getElementById('condMain');
const meta = document.getElementById('meta');
const feelEl = document.getElementById('feel');
const humEl = document.getElementById('hum');
const windEl = document.getElementById('wind');
const resultPopup = document.getElementById('resultPopup');
const resIcon = document.getElementById('resIcon');
const resTitle = document.getElementById('resTitle');
const resSub = document.getElementById('resSub');
const miniLoader = document.getElementById('miniLoader');

// Create suggestion box container below input
const suggestionBox = document.createElement('div');
suggestionBox.style.position = 'absolute';
suggestionBox.style.top = (qInput.offsetHeight + 4) + 'px'; // 4px gap below input
suggestionBox.style.left = '0';
suggestionBox.style.width = qInput.offsetWidth + 'px';
suggestionBox.style.background = '#0f172a'; // solid color background
suggestionBox.style.border = '1px solid rgba(109,211,244,0.6)';
suggestionBox.style.borderRadius = '6px';
suggestionBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
suggestionBox.style.zIndex = '1000';
suggestionBox.style.maxHeight = '220px';
suggestionBox.style.overflowY = 'auto';
suggestionBox.style.fontSize = '14px';
suggestionBox.style.color = '#eaf0ff';
suggestionBox.style.cursor = 'pointer';
suggestionBox.style.display = 'none';
suggestionBox.style.padding = '0';
qInput.parentNode.style.position = 'relative'; // important for absolute positioning
qInput.parentNode.appendChild(suggestionBox);

// Helper
const round = v => Math.round(v);

// Show popup inside .right panel
function showPopup(iconTxt, title, subtitle){
  resIcon.textContent = iconTxt;
  resTitle.textContent = title;
  resSub.textContent = subtitle;
  resultPopup.style.position = 'static';
  resultPopup.style.transform = 'none';
  resultPopup.style.top = 'auto';
  resultPopup.style.left = 'auto';
  resultPopup.style.marginTop = '20px';
  resultPopup.style.minWidth = 'auto';
  resultPopup.style.maxWidth = '100%';
  resultPopup.style.borderRadius = '12px';
  resultPopup.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))';
  resultPopup.style.border = '1px solid rgba(255,255,255,0.04)';
  resultPopup.style.boxShadow = '0 12px 36px rgba(2,6,23,0.5)';
  resultPopup.classList.remove('show');
  void resultPopup.offsetWidth; // trigger reflow for animation restart
  resultPopup.classList.add('show');
  setTimeout(() => resultPopup.classList.remove('show'), 100000);
}

// Show loading spinner
function showLoading(on=true){
  miniLoader.classList.toggle('hidden', !on);
}

// Fetch weather data
async function fetchWeather(q){
  if(!q) return;
  clearSuggestions();
  try {
    showLoading(true);
    const url = `${BASE}?key=${API_KEY}&q=${encodeURIComponent(q)}&aqi=yes`;
    const res = await fetch(url);
    if(!res.ok){
      const text = await res.text();
      throw new Error('API error: ' + (text || res.status));
    }
    const data = await res.json();
    render(data);
    showPopup('°', `${data.location.name}, ${data.location.country}`, `${round(data.current.temp_c)}°C • ${data.current.condition.text}`);
    showLoading(false);
  } catch(err){
    showLoading(false);
    alert('Could not fetch weather — ' + (err.message || err));
    console.error(err);
  }
}

// Render UI from data
function render(d){
  if(!d || !d.current) return;
  iconImg.src = (d.current.condition.icon || '').replace('//','https://');
  tempMain.textContent = `${round(d.current.temp_c)}°C`;
  condMain.textContent = d.current.condition.text;
  meta.textContent = `Local time: ${d.location.localtime}`;
  feelEl.textContent = `${round(d.current.feelslike_c)}°C`;
  humEl.textContent = `${d.current.humidity}%`;
  windEl.textContent = `${d.current.wind_kph} kph`;
}

// Fetch location suggestions (autocomplete)
let debounceTimeout;
async function fetchSuggestions(query){
  if(debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(async () => {
    if(!query) {
      clearSuggestions();
      return;
    }
    try {
      const url = `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if(!res.ok){
        clearSuggestions();
        return;
      }
      const data = await res.json();
      showSuggestions(data);
    } catch {
      clearSuggestions();
    }
  }, 300);
}

function showSuggestions(locations){
  clearSuggestions();
  if(!locations || locations.length === 0) {
    suggestionBox.style.display = 'none';
    return;
  }
  locations.forEach(loc => {
    const div = document.createElement('div');
    div.textContent = `${loc.name}, ${loc.region ? loc.region + ', ' : ''}${loc.country}`;
    div.style.padding = '8px 12px';
    div.style.transition = 'background-color 0.2s ease';
    div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    div.addEventListener('mouseenter', () => {
      div.style.backgroundColor = 'rgba(109,211,244,0.2)';
    });
    div.addEventListener('mouseleave', () => {
      div.style.backgroundColor = 'transparent';
    });
    div.addEventListener('click', () => {
      qInput.value = div.textContent; // set full text on click only
      clearSuggestions();
      fetchWeather(qInput.value);
    });
    suggestionBox.appendChild(div);
  });
  suggestionBox.style.display = 'block';
}

function clearSuggestions(){
  suggestionBox.innerHTML = '';
  suggestionBox.style.display = 'none';
}

// Event listeners
searchBtn.addEventListener('click', () => fetchWeather(qInput.value || 'London'));
qInput.addEventListener('input', e => fetchSuggestions(e.target.value));
qInput.addEventListener('keydown', e => {
  if(e.key === 'Enter') {
    clearSuggestions();
    fetchWeather(qInput.value || 'London');
  }
});
chips.forEach(c => c.addEventListener('click', () => { 
  qInput.value = c.dataset.city; 
  fetchWeather(c.dataset.city); 
}));

// Initial fetch
window.addEventListener('load', () => {
  fetchWeather(qInput.value || 'London');
});

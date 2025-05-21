// Game configuration
const GAME_CONFIG = {
  // Item generation settings
  spawnRadius: 100, // meters
  minItems: 5,
  maxItems: 10,
  cookieProbability: 0.7, // 70% chance of spawning a cookie (vs ticket)
  cookieValue: 1,
  ticketValue: 1,
  
  // Movement settings
  minDistanceChange: 5, // meters - minimum distance to trigger a step
  
  // Audio settings
  backgroundMusicVolume: 0.3,
  soundEffectsVolume: 0.5
};

// Game state
let gameState = {
  tracking: false,
  playerPosition: null, // [lat, lng]
  watchId: null,
  items: [], // {id, type, position, value, collected}
  stats: {
    steps: 0,
    distance: 0,
    cookies: 0,
    tickets: 0
  },
  lastPosition: null,
  map: null,
  playerMarker: null,
  itemMarkers: [],
  audioEnabled: true,
  backgroundMusic: null,
  soundEffects: {
    cookieCollect: null,
    ticketCollect: null,
    startTracking: null,
    stopTracking: null
  }
};

// DOM Elements
const elements = {
  map: document.getElementById('map'),
  trackButton: document.getElementById('trackButton'),
  audioControl: document.getElementById('audioControl'),
  toast: document.getElementById('toast'),
  loading: document.getElementById('loading'),
  permissionDialog: document.getElementById('permissionDialog'),
  requestPermission: document.getElementById('requestPermission'),
  stats: {
    steps: document.getElementById('steps'),
    distance: document.getElementById('distance'),
    cookies: document.getElementById('cookies'),
    tickets: document.getElementById('tickets')
  }
};

// Initialize the game
function initGame() {
  // Initialize map centered on Philadelphia (default location)
  const philadelphiaCoords = [39.9526, -75.1652];
  
  gameState.map = L.map('map', {
    center: philadelphiaCoords,
    zoom: 16,
    zoomControl: false,
    attributionControl: false
  });
  
  // Add tile layer (map style)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(gameState.map);
  
  // Create player marker (initially hidden)
  const cookieIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/541/541732.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
  
  gameState.playerMarker = L.marker(philadelphiaCoords, {
    icon: cookieIcon,
    zIndexOffset: 1000
  });
  
  // Initialize audio
  initAudio();
  
  // Set up event listeners
  setupEventListeners();
  
  // Check location permission
  checkLocationPermission();
}

// Initialize audio elements
function initAudio() {
  // Background music
  gameState.backgroundMusic = new Audio('https://cdn.pixabay.com/download/audio/2022/10/29/audio_8b320986f0.mp3?filename=coming-of-age-chiptune-retro-80s-nintendo-pcm-fm-instrumental-151693.mp3');
  gameState.backgroundMusic.loop = true;
  gameState.backgroundMusic.volume = GAME_CONFIG.backgroundMusicVolume;
  
  // Sound effects
  gameState.soundEffects.cookieCollect = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=success-1-6297.mp3');
  gameState.soundEffects.ticketCollect = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_a4878a08eb.mp3?filename=success-fanfare-trumpets-6185.mp3');
  gameState.soundEffects.startTracking = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_febc508a21.mp3?filename=interface-124464.mp3');
  gameState.soundEffects.stopTracking = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_9aac35913b.mp3?filename=negative_beeps-6008.mp3');
  
  // Set volumes
  Object.values(gameState.soundEffects).forEach(sound => {
    sound.volume = GAME_CONFIG.soundEffectsVolume;
  });
}

// Set up event listeners
function setupEventListeners() {
  // Track button
  elements.trackButton.addEventListener('click', toggleTracking);
  
  // Audio control
  elements.audioControl.addEventListener('click', toggleAudio);
  
  // Permission request
  elements.requestPermission.addEventListener('click', requestLocationPermission);
}

// Check if location permission is granted
function checkLocationPermission() {
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' })
      .then(permissionStatus => {
        if (permissionStatus.state === 'granted') {
          hideLoading();
        } else if (permissionStatus.state === 'prompt') {
          hideLoading();
          showPermissionDialog();
        } else {
          hideLoading();
          showToast('Location permission denied. Please enable location access in your browser settings.');
        }
      });
  } else {
    // Fallback for browsers that don't support the Permissions API
    hideLoading();
  }
}

// Request location permission
function requestLocationPermission() {
  hidePermissionDialog();
  showLoading();
  
  navigator.geolocation.getCurrentPosition(
    position => {
      hideLoading();
      showToast('Location access granted!');
      
      // Center map on user's location
      const { latitude, longitude } = position.coords;
      gameState.map.setView([latitude, longitude], 16);
      
      // Show player marker
      gameState.playerMarker.setLatLng([latitude, longitude]).addTo(gameState.map);
    },
    error => {
      hideLoading();
      showPermissionDialog();
      console.error('Error getting location:', error);
    }
  );
}

// Toggle tracking on/off
function toggleTracking() {
  if (gameState.tracking) {
    stopTracking();
  } else {
    startTracking();
  }
}

// Start location tracking
function startTracking() {
  showLoading();
  
  navigator.geolocation.getCurrentPosition(
    position => {
      hideLoading();
      
      const { latitude, longitude } = position.coords;
      gameState.playerPosition = [latitude, longitude];
      gameState.lastPosition = [latitude, longitude];
      
      // Update map and player marker
      gameState.map.setView([latitude, longitude], 16);
      gameState.playerMarker.setLatLng([latitude, longitude]).addTo(gameState.map);
      
      // Generate items around player
      generateItems();
      
      // Start continuous tracking
      gameState.watchId = navigator.geolocation.watchPosition(
        updatePlayerPosition,
        locationError,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      
      // Update game state and UI
      gameState.tracking = true;
      elements.trackButton.textContent = 'STOP TRACKING';
      elements.trackButton.classList.add('tracking');
      
      // Play sound and music
      if (gameState.audioEnabled) {
        gameState.soundEffects.startTracking.play();
        gameState.backgroundMusic.play();
      }
      
      showToast('Tracking started! Find cookies and tickets around you.');
    },
    error => {
      hideLoading();
      locationError(error);
    }
  );
}

// Stop location tracking
function stopTracking() {
  if (gameState.watchId !== null) {
    navigator.geolocation.clearWatch(gameState.watchId);
    gameState.watchId = null;
  }
  
  // Update game state and UI
  gameState.tracking = false;
  elements.trackButton.textContent = 'START TRACKING';
  elements.trackButton.classList.remove('tracking');
  
  // Remove item markers from map
  clearItemMarkers();
  
  // Play sound and stop music
  if (gameState.audioEnabled) {
    gameState.soundEffects.stopTracking.play();
    gameState.backgroundMusic.pause();
    gameState.backgroundMusic.currentTime = 0;
  }
  
  showToast('Tracking stopped.');
}

// Update player position based on geolocation data
function updatePlayerPosition(position) {
  const { latitude, longitude } = position.coords;
  const newPosition = [latitude, longitude];
  
  // Calculate distance moved
  const prevPosition = gameState.playerPosition || newPosition;
  const distance = calculateDistance(prevPosition, newPosition);
  
  // Update player position
  gameState.playerPosition = newPosition;
  
  // Update player marker
  gameState.playerMarker.setLatLng(newPosition);
  
  // Center map on player
  gameState.map.setView(newPosition);
  
  // Check for collected items
  checkItemCollection();
  
  // Update stats if moved enough
  if (distance >= GAME_CONFIG.minDistanceChange) {
    gameState.stats.steps++;
    gameState.stats.distance += Math.round(distance);
    
    // Only count as a new position if we've moved enough
    gameState.lastPosition = gameState.playerPosition;
    
    // Update UI
    updateStatsDisplay();
  }
}

// Generate random items around the player
function generateItems() {
  // Clear existing items
  gameState.items = [];
  clearItemMarkers();
  
  // Generate random number of items
  const itemCount = Math.floor(Math.random() * (GAME_CONFIG.maxItems - GAME_CONFIG.minItems + 1)) + GAME_CONFIG.minItems;
  
  for (let i = 0; i < itemCount; i++) {
    // Generate random position around player
    const randomPosition = generateRandomPositionAround(gameState.playerPosition, GAME_CONFIG.spawnRadius);
    
    // Determine item type (cookie or ticket)
    const type = Math.random() < GAME_CONFIG.cookieProbability ? 'cookie' : 'ticket';
    
    // Create item
    const item = {
      id: generateId(),
      type: type,
      position: randomPosition,
      value: type === 'cookie' ? GAME_CONFIG.cookieValue : GAME_CONFIG.ticketValue,
      collected: false
    };
    
    // Add to items array
    gameState.items.push(item);
    
    // Add marker to map
    addItemMarker(item);
  }
}

// Add marker for an item on the map
function addItemMarker(item) {
  const icon = L.icon({
    iconUrl: item.type === 'cookie' 
      ? 'https://cdn-icons-png.flaticon.com/512/541/541732.png'  // Cookie icon
      : 'https://cdn-icons-png.flaticon.com/512/3330/3330300.png', // Ticket icon
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
  
  const marker = L.marker(item.position, { icon }).addTo(gameState.map);
  
  // Store marker reference
  gameState.itemMarkers.push({ id: item.id, marker });
}

// Remove all item markers from the map
function clearItemMarkers() {
  gameState.itemMarkers.forEach(({ marker }) => {
    gameState.map.removeLayer(marker);
  });
  
  gameState.itemMarkers = [];
}

// Check if player has collected any items
function checkItemCollection() {
  if (!gameState.playerPosition) return;
  
  gameState.items.forEach(item => {
    if (!item.collected) {
      const distance = calculateDistance(gameState.playerPosition, item.position);
      
      // If player is close enough to item (10 meters)
      if (distance <= 10) {
        collectItem(item);
      }
    }
  });
}

// Collect an item
function collectItem(item) {
  // Mark as collected
  item.collected = true;
  
  // Update stats
  if (item.type === 'cookie') {
    gameState.stats.cookies += item.value;
    if (gameState.audioEnabled) {
      gameState.soundEffects.cookieCollect.play();
    }
    showToast(`Collected a cookie! (+${item.value})`);
  } else {
    gameState.stats.tickets += item.value;
    if (gameState.audioEnabled) {
      gameState.soundEffects.ticketCollect.play();
    }
    showToast(`Collected a golden ticket! (+${item.value})`);
  }
  
  // Update stats display
  updateStatsDisplay();
  
  // Remove marker from map
  const markerIndex = gameState.itemMarkers.findIndex(marker => marker.id === item.id);
  if (markerIndex !== -1) {
    gameState.map.removeLayer(gameState.itemMarkers[markerIndex].marker);
    gameState.itemMarkers.splice(markerIndex, 1);
  }
}

// Update stats display
function updateStatsDisplay() {
  elements.stats.steps.textContent = gameState.stats.steps;
  elements.stats.distance.textContent = gameState.stats.distance;
  elements.stats.cookies.textContent = gameState.stats.cookies;
  elements.stats.tickets.textContent = gameState.stats.tickets;
}

// Toggle audio on/off
function toggleAudio() {
  gameState.audioEnabled = !gameState.audioEnabled;
  
  if (gameState.audioEnabled) {
    elements.audioControl.textContent = '🔊';
    if (gameState.tracking) {
      gameState.backgroundMusic.play();
    }
  } else {
    elements.audioControl.textContent = '🔇';
    gameState.backgroundMusic.pause();
  }
}

// Show a toast notification
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// Show loading indicator
function showLoading() {
  elements.loading.style.display = 'flex';
}

// Hide loading indicator
function hideLoading() {
  elements.loading.style.display = 'none';
}

// Show permission dialog
function showPermissionDialog() {
  elements.permissionDialog.style.display = 'flex';
}

// Hide permission dialog
function hidePermissionDialog() {
  elements.permissionDialog.style.display = 'none';
}

// Handle location errors
function locationError(error) {
  hideLoading();
  
  let message = 'Error getting location.';
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      message = 'Location permission denied. Please enable location access in your browser settings.';
      break;
    case error.POSITION_UNAVAILABLE:
      message = 'Location information is unavailable. Please check your device settings.';
      break;
    case error.TIMEOUT:
      message = 'Location request timed out. Please try again.';
      break;
  }
  
  showToast(message);
  console.error('Geolocation error:', error);
}

// Generate a random position around a center point within a given radius (in meters)
function generateRandomPositionAround(center, radius) {
  // Earth's radius in meters
  const earthRadius = 6378137;
  
  // Convert radius from meters to degrees
  const radiusInDegrees = radius / earthRadius * (180 / Math.PI);
  
  // Generate random values for angle and distance
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * radiusInDegrees;
  
  // Calculate new position
  const newLat = center[0] + distance * Math.cos(angle);
  const newLng = center[1] + distance * Math.sin(angle);
  
  return [newLat, newLng];
}

// Calculate distance between two points in meters using Haversine formula
function calculateDistance(point1, point2) {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

// Generate a unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Initialize the game when the page loads
window.addEventListener('load', initGame);
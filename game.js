// Game configuration
const GAME_CONFIG = {
  // Item generation settings
  spawnRadius: 150, // meters
  minItems: 8,
  maxItems: 15,
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
  initialized: false,
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
  sfxEnabled: true,
  backgroundMusic: null,
  soundEffects: {
    cookieCollect: null,
    ticketCollect: null,
    startTracking: null,
    stopTracking: null
  },
  mapInitialZoom: 16
};

// DOM Elements
const elements = {
  welcomeOverlay: document.getElementById('welcomeOverlay'),
  startButton: document.getElementById('startButton'),
  map: document.getElementById('map'),
  trackButton: document.getElementById('trackButton'),
  audioControl: document.getElementById('audioControl'),
  sfxControl: document.getElementById('sfxControl'),
  toast: document.getElementById('toast'),
  loading: document.getElementById('loading'),
  permissionDialog: document.getElementById('permissionDialog'),
  requestPermission: document.getElementById('requestPermission'),
  zoomIn: document.getElementById('zoomIn'),
  zoomOut: document.getElementById('zoomOut'),
  recenter: document.getElementById('recenter'),
  backgroundMusic: document.getElementById('backgroundMusic'),
  stats: {
    steps: document.getElementById('steps'),
    distance: document.getElementById('distance'),
    cookies: document.getElementById('cookies'),
    tickets: document.getElementById('tickets')
  }
};

// Initialize the game
function initGame() {
  console.log('Initializing Cookie Hunt game');
  
  // Initialize map - default to a broader world view instead of just Philadelphia
  const defaultCoords = [40.0, -75.0]; // Still near Philadelphia but slightly zoomed out
  
  gameState.map = L.map('map', {
    center: defaultCoords,
    zoom: gameState.mapInitialZoom,
    zoomControl: false,
    minZoom: 3,
    maxZoom: 19,
    attributionControl: false,
    doubleClickZoom: true
  });
  
  // Enable touch gestures for mobile
  gameState.map.dragging.enable();
  gameState.map.touchZoom.enable();
  
  // Add tile layer (map style)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(gameState.map);
  
  // Create player marker (initially hidden)
  const playerIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1301/1301464.png', // Character icon
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
  
  gameState.playerMarker = L.marker(defaultCoords, {
    icon: playerIcon,
    zIndexOffset: 1000
  });
  
  // Initialize audio
  initAudio();
  
  // Set up event listeners
  setupEventListeners();
  
  gameState.initialized = true;
  
  // Hide loading screen once everything is ready
  hideLoading();
}

// Initialize audio elements
function initAudio() {
  console.log('Initializing audio');
  
  // Use the HTML audio element for background music
  gameState.backgroundMusic = elements.backgroundMusic;
  gameState.backgroundMusic.volume = GAME_CONFIG.backgroundMusicVolume;
  
  // Sound effects
  gameState.soundEffects.cookieCollect = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=success-1-6297.mp3');
  gameState.soundEffects.ticketCollect = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_a4878a08eb.mp3?filename=success-fanfare-trumpets-6185.mp3');
  gameState.soundEffects.startTracking = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_febc508a21.mp3?filename=interface-124464.mp3');
  gameState.soundEffects.stopTracking = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_9aac35913b.mp3?filename=negative_beeps-6008.mp3');
  
  // Set volumes for sound effects
  Object.values(gameState.soundEffects).forEach(sound => {
    sound.volume = GAME_CONFIG.soundEffectsVolume;
  });
  
  // Preload all audio to avoid delays
  gameState.backgroundMusic.load();
  Object.values(gameState.soundEffects).forEach(sound => {
    try {
      sound.load();
    } catch (error) {
      console.warn('Error preloading sound:', error);
    }
  });
}

// Set up event listeners
function setupEventListeners() {
  console.log('Setting up event listeners');
  
  // Welcome screen start button
  elements.startButton.addEventListener('click', startGame);
  
  // Track button
  elements.trackButton.addEventListener('click', toggleTracking);
  
  // Audio controls
  elements.audioControl.addEventListener('click', toggleMusic);
  elements.sfxControl.addEventListener('click', toggleSoundEffects);
  
  // Map controls
  elements.zoomIn.addEventListener('click', () => gameState.map.zoomIn());
  elements.zoomOut.addEventListener('click', () => gameState.map.zoomOut());
  elements.recenter.addEventListener('click', centerMapOnPlayer);
  
  // Permission request
  elements.requestPermission.addEventListener('click', requestLocationPermission);
}

// Start the game (from welcome screen)
function startGame() {
  console.log('Starting game');
  
  // Hide welcome overlay with a fade-out effect
  elements.welcomeOverlay.style.opacity = '0';
  setTimeout(() => {
    elements.welcomeOverlay.style.display = 'none';
  }, 500);
  
  // Check location permission and start tracking automatically
  showLoading();
  checkLocationPermission();
}

// Check if location permission is granted
function checkLocationPermission() {
  console.log('Checking location permission');
  
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' })
      .then(permissionStatus => {
        if (permissionStatus.state === 'granted') {
          hideLoading();
          // Auto start tracking if permission is already granted
          startTracking();
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
    
    // Try to get the location anyway
    navigator.geolocation.getCurrentPosition(
      () => startTracking(),
      () => showPermissionDialog(),
      { timeout: 5000 }
    );
  }
}

// Request location permission
function requestLocationPermission() {
  console.log('Requesting location permission');
  
  hidePermissionDialog();
  showLoading();
  
  navigator.geolocation.getCurrentPosition(
    position => {
      hideLoading();
      showToast('Location access granted!');
      
      // Center map on user's location
      const { latitude, longitude } = position.coords;
      gameState.map.setView([latitude, longitude], gameState.mapInitialZoom);
      
      // Show player marker
      gameState.playerMarker.setLatLng([latitude, longitude]).addTo(gameState.map);
      
      // Auto start tracking
      startTracking();
    },
    error => {
      hideLoading();
      showPermissionDialog();
      console.error('Error getting location:', error);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
  console.log('Starting location tracking');
  
  if (gameState.tracking) return; // Already tracking
  
  showLoading();
  
  navigator.geolocation.getCurrentPosition(
    position => {
      hideLoading();
      
      const { latitude, longitude } = position.coords;
      gameState.playerPosition = [latitude, longitude];
      gameState.lastPosition = [latitude, longitude];
      
      // Update map and player marker
      gameState.map.setView([latitude, longitude], gameState.mapInitialZoom);
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
      playSound('startTracking');
      
      // Start background music if enabled
      if (gameState.audioEnabled) {
        gameState.backgroundMusic.play().catch(err => {
          console.error('Error playing background music:', err);
        });
      }
      
      showToast('Tracking started! Find cookies and tickets around you.');
    },
    error => {
      hideLoading();
      locationError(error);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// Stop location tracking
function stopTracking() {
  console.log('Stopping location tracking');
  
  if (!gameState.tracking) return; // Not tracking
  
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
  playSound('stopTracking');
  
  // Stop background music
  gameState.backgroundMusic.pause();
  gameState.backgroundMusic.currentTime = 0;
  
  showToast('Tracking stopped.');
}

// Center map on player's current position
function centerMapOnPlayer() {
  if (gameState.playerPosition) {
    gameState.map.setView(gameState.playerPosition, gameState.mapInitialZoom);
    showToast('Map centered on your location');
  } else {
    showToast('Your location is not available yet');
  }
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
  
  // Only center map if user hasn't manually moved it
  if (gameState.map.autoFollowing !== false) {
    gameState.map.setView(newPosition);
  }
  
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
  console.log('Generating items around player');
  
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
  
  console.log(`Generated ${itemCount} items`);
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
  
  // Add a popup with item information
  marker.bindPopup(item.type === 'cookie' ? 'Tasty Cookie' : 'Golden Ticket');
  
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
      
      // If player is close enough to item (15 meters)
      if (distance <= 15) {
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
    playSound('cookieCollect');
    showToast(`Collected a cookie! (+${item.value})`);
  } else {
    gameState.stats.tickets += item.value;
    playSound('ticketCollect');
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

// Play a sound effect if enabled
function playSound(soundName) {
  if (gameState.sfxEnabled && gameState.soundEffects[soundName]) {
    // Clone the audio to allow overlapping sounds
    const sound = gameState.soundEffects[soundName].cloneNode();
    sound.volume = GAME_CONFIG.soundEffectsVolume;
    
    sound.play().catch(err => {
      console.warn(`Error playing ${soundName} sound:`, err);
    });
  }
}

// Toggle background music on/off
function toggleMusic() {
  gameState.audioEnabled = !gameState.audioEnabled;
  
  if (gameState.audioEnabled) {
    elements.audioControl.textContent = '🔊';
    if (gameState.tracking) {
      gameState.backgroundMusic.play().catch(err => {
        console.error('Error playing background music:', err);
      });
    }
  } else {
    elements.audioControl.textContent = '🔇';
    gameState.backgroundMusic.pause();
  }
  
  showToast(gameState.audioEnabled ? 'Music on' : 'Music off');
}

// Toggle sound effects on/off
function toggleSoundEffects() {
  gameState.sfxEnabled = !gameState.sfxEnabled;
  
  elements.sfxControl.textContent = gameState.sfxEnabled ? '🔔' : '🔕';
  
  showToast(gameState.sfxEnabled ? 'Sound effects on' : 'Sound effects off');
}

// Update stats display
function updateStatsDisplay() {
  elements.stats.steps.textContent = gameState.stats.steps;
  elements.stats.distance.textContent = gameState.stats.distance;
  elements.stats.cookies.textContent = gameState.stats.cookies;
  elements.stats.tickets.textContent = gameState.stats.tickets;
}

// Show a toast notification
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  
  // Clear any existing timeout
  if (elements.toast.timeoutId) {
    clearTimeout(elements.toast.timeoutId);
  }
  
  // Set new timeout
  elements.toast.timeoutId = setTimeout(() => {
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
  // Use sqrt to get more uniform distribution
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

// Handle manual map movement by the user
gameState.map && gameState.map.on('dragstart', function() {
  // User manually moved the map, disable auto-following
  gameState.map.autoFollowing = false;
});

// Initialize the game when the page loads
window.addEventListener('load', function() {
  console.log('Page loaded, initializing game');
  initGame();
});
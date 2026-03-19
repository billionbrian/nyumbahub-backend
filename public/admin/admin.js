document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addHouseForm');
  const statusDiv = document.getElementById('status');
  const latInput = document.getElementById('lat');
  const lngInput = document.getElementById('lng');

  // Initialize map
  const map = L.map('adminMap').setView([-1.2921, 36.8219], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  let marker = null;

  // Click map to set coordinates
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    latInput.value = lat.toFixed(6);
    lngInput.value = lng.toFixed(6);

    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map);
  });

  // Geocode button using Nominatim (OpenStreetMap)
  document.getElementById('geocodeBtn').addEventListener('click', async () => {
    const address = form.location.value.trim();
    if (!address) return alert('Enter an address or area first');

    statusDiv.textContent = 'Looking up coordinates...';

    try {
      const q = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' }});
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        latInput.value = parseFloat(lat).toFixed(6);
        lngInput.value = parseFloat(lon).toFixed(6);

        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lon]).addTo(map);
        map.setView([lat, lon], 15);

        statusDiv.textContent = 'Found coordinates — adjust on map if needed.';
      } else {
        statusDiv.textContent = 'Could not find that address. Try a different query.';
      }
    } catch (err) {
      console.error(err);
      statusDiv.textContent = 'Geocoding failed. Check network.';
    }

    setTimeout(()=> statusDiv.textContent = '', 4000);
  });

  // Submit form -> POST to /houses
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = {
      title: formData.get('title'),
      description: formData.get('description'),
      location: formData.get('location'),
      price: Number(formData.get('price')),
      size: Number(formData.get('size')),
      lat: formData.get('lat') ? Number(formData.get('lat')) : undefined,
      lng: formData.get('lng') ? Number(formData.get('lng')) : undefined
    };

    statusDiv.textContent = 'Saving...';

    try {
      const res = await fetch('/houses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        statusDiv.textContent = 'Listing added ✓';
        form.reset();
        if (marker) { map.removeLayer(marker); marker = null; }
        setTimeout(()=> statusDiv.textContent = '', 3000);
      } else {
        const err = await res.json().catch(()=> null);
        statusDiv.textContent = 'Error: ' + (err?.error || res.statusText);
      }
    } catch (err) {
      console.error(err);
      statusDiv.textContent = 'Network error while saving';
    }
  });
});

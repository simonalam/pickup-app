import { useState, useEffect, useCallback, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { createClient } from "@supabase/supabase-js";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

function getDistanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

async function fetchOSMCourts(lat, lng) {
  const query = `[out:json][timeout:25];(node["leisure"="pitch"]["sport"="basketball"](around:8000,${lat},${lng});way["leisure"="pitch"]["sport"="basketball"](around:8000,${lat},${lng});relation["leisure"="pitch"]["sport"="basketball"](around:8000,${lat},${lng}););out center;`;
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
    const data = await res.json();
    return data.elements.map(el => {
      const elLat = el.lat || el.center?.lat;
      const elLng = el.lon || el.center?.lon;
      if (!elLat || !elLng) return null;
      return {
        place_id: `osm_${el.type}_${el.id}`,
        name: el.tags?.name || "Basketball Court",
        address: el.tags?.["addr:street"] ? `${el.tags["addr:housenumber"] || ""} ${el.tags["addr:street"]}`.trim() : "OpenStreetMap court",
        lat: elLat, lng: elLng,
        surface: el.tags?.surface || null,
        access: el.tags?.access || "public",
        lit: el.tags?.lit || null,
        distance: getDistanceMiles(lat, lng, elLat, elLng),
        source: "osm",
      };
    }).filter(Boolean);
  } catch { return []; }
}

async function geocodeLocation(query) {
  return new Promise((resolve) => {
    if (!window.google?.maps) return resolve(null);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        const comps = results[0].address_components;
        const city = comps?.find(c => c.types.includes("locality"))?.long_name;
        const state = comps?.find(c => c.types.includes("administrative_area_level_1"))?.short_name;
        const label = city && state ? `${city}, ${state}` : city || results[0].formatted_address;
        resolve({ lat: lat(), lng: lng(), label });
      } else {
        resolve(null);
      }
    });
  });
}

const StarRating = ({ rating, interactive = false, onRate }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} onClick={() => interactive && onRate?.(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{ fontSize: interactive ? 22 : 14, cursor: interactive ? "pointer" : "default", color: s <= (hover || rating) ? "#F97316" : "#2a2a2a", transition: "color 0.15s" }}>★</span>
      ))}
    </div>
  );
};

const sourceBadge = (source) => {
  if (source === "community") return { bg: "#7c3aed", label: "COMMUNITY" };
  if (source === "osm") return { bg: "#0369a1", label: "OPENSTREETMAP" };
  return { bg: "#166534", label: "OUTDOOR" };
};

const CourtCard = ({ court, onClick, active }) => {
  const badge = sourceBadge(court.source);
  return (
    <div onClick={() => onClick(court)} style={{ background: active ? "#0f1923" : "#0a0f14", border: `1px solid ${active ? "#F97316" : "#1a2530"}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease", transform: active ? "scale(1.01)" : "scale(1)", boxShadow: active ? "0 0 0 2px #F97316" : "none", flexShrink: 0 }}>
      <div style={{ position: "relative", height: 130 }}>
        {court.photo
          ? <img src={court.photo} alt={court.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0f1923 0%, #1e3a5f 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🏀</div>
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", top: 10, right: 10, background: badge.bg, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{badge.label}</div>
        <div style={{ position: "absolute", bottom: 10, left: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em", color: "#fff" }}>{court.name}</div>
        </div>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StarRating rating={Math.round(court.rating || 0)} />
            <span style={{ color: "#F97316", fontWeight: 700, fontSize: 13 }}>{court.rating?.toFixed(1) || "—"}</span>
            {court.totalRatings && <span style={{ color: "#4a5568", fontSize: 12 }}>({court.totalRatings})</span>}
          </div>
          {court.distance && <span style={{ color: "#F97316", fontSize: 12, fontWeight: 600 }}>{court.distance} mi</span>}
        </div>
        <div style={{ color: "#64748b", fontSize: 12 }}>{court.address}</div>
        {(court.surface || court.lit === "yes") && (
          <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
            {court.surface && <span style={{ background: "#0f1923", border: "1px solid #1e2d3d", color: "#94a3b8", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{court.surface}</span>}
            {court.lit === "yes" && <span style={{ background: "#0f1923", border: "1px solid #1e2d3d", color: "#F97316", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>💡 Lit</span>}
          </div>
        )}
      </div>
    </div>
  );
};

const CourtDetail = ({ court, onClose }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ text: "", rating: 5, user: "" });
  const [tab, setTab] = useState("reviews");
  const [reviews, setReviews] = useState([]);
  const [imgError, setImgError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const badge = sourceBadge(court.source);
  const isOpen = court.openNow === true;
  const isClosed = court.openNow === false;

  useEffect(() => {
    supabase.from("reviews").select("*").eq("place_id", court.place_id).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setReviews(data); });
  }, [court.place_id]);

  const handleSubmit = async () => {
    if (!newReview.text || !newReview.user) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("reviews").insert([{ place_id: court.place_id, court_name: court.name, user_name: newReview.user, rating: newReview.rating, text: newReview.text }]).select();
    if (!error && data) setReviews(prev => [data[0], ...prev]);
    setNewReview({ text: "", rating: 5, user: "" });
    setShowReviewForm(false);
    setSubmitting(false);
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <style>{`@keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .detail-sheet { animation: slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1); }`}</style>
      <div className="detail-sheet" style={{ background: "#0a0f14", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 680, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #1a2530", borderBottom: "none" }}>
        <div style={{ position: "relative", height: 220, flexShrink: 0, background: "linear-gradient(135deg, #0f1923 0%, #1e3a5f 100%)" }}>
          {court.photo && !imgError ? <img src={court.photo} alt={court.name} onError={() => setImgError(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 80, opacity: 0.2 }}>🏀</div></div>}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0a0f14 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ position: "absolute", top: 16, left: 16, background: badge.bg, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
            {court.source === "osm" ? "🗺 OPENSTREETMAP" : court.source === "community" ? "👥 COMMUNITY" : isOpen ? "● OPEN NOW" : isClosed ? "● CLOSED" : "● OUTDOOR"}
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 24px 16px" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.05em", lineHeight: 1.1, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{court.name}</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>📍 {court.address}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid #1a2530", flexShrink: 0 }}>
          {[{ label: "Rating", value: court.rating?.toFixed(1) || "—", icon: "⭐" }, { label: "Reviews", value: court.totalRatings ? (court.totalRatings >= 1000 ? (court.totalRatings / 1000).toFixed(1) + "k" : court.totalRatings) : reviews.length || "0", icon: "💬" }, { label: "Distance", value: court.distance ? `${court.distance} mi` : "—", icon: "📍" }, { label: "Surface", value: court.surface || (isOpen ? "Open" : isClosed ? "Closed" : "—"), icon: "🏀" }].map(({ label, value, icon }, i) => (
            <div key={label} style={{ padding: "14px 8px", textAlign: "center", borderRight: i < 3 ? "1px solid #1a2530" : "none" }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>{icon}</div>
              <div style={{ color: "#F97316", fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.05em", lineHeight: 1, textTransform: "capitalize" }}>{value}</div>
              <div style={{ color: "#4a5568", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid #1a2530", flexShrink: 0, padding: "0 20px", background: "#06090d" }}>
          {["reviews", "info"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: tab === t ? "#F97316" : "#4a5568", fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: "12px 18px", cursor: "pointer", borderBottom: tab === t ? "2px solid #F97316" : "2px solid transparent", textTransform: "capitalize", transition: "color 0.15s" }}>{t}</button>
          ))}
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {tab === "reviews" && (
            <>
              {!showReviewForm ? (
                <button onClick={() => setShowReviewForm(true)} style={{ width: "100%", background: "linear-gradient(135deg, #1e3a5f 0%, #0f1923 100%)", border: "1px dashed #F97316", color: "#F97316", borderRadius: 14, padding: "14px", fontFamily: "inherit", fontSize: 14, cursor: "pointer", marginBottom: 20, fontWeight: 600 }}>🏀 Write a Review</button>
              ) : (
                <div style={{ background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Your Rating</div>
                    <StarRating rating={newReview.rating} interactive onRate={(r) => setNewReview(p => ({ ...p, rating: r }))} />
                  </div>
                  <input value={newReview.user} onChange={e => setNewReview(p => ({ ...p, user: e.target.value }))} placeholder="Your name" style={{ width: "100%", background: "#0a0f14", border: "1px solid #1e2d3d", borderRadius: 10, padding: "10px 14px", color: "#fff", fontFamily: "inherit", fontSize: 14, marginBottom: 10, boxSizing: "border-box" }} />
                  <textarea value={newReview.text} onChange={e => setNewReview(p => ({ ...p, text: e.target.value }))} placeholder="How's the court? Rims, pavement, competition level..." rows={3} style={{ width: "100%", background: "#0a0f14", border: "1px solid #1e2d3d", borderRadius: 10, padding: "10px 14px", color: "#fff", fontFamily: "inherit", fontSize: 14, resize: "none", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, background: "#F97316", border: "none", color: "#fff", borderRadius: 10, padding: "11px", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>{submitting ? "Posting..." : "Post Review"}</button>
                    <button onClick={() => setShowReviewForm(false)} style={{ background: "#0a0f14", border: "1px solid #1e2d3d", color: "#64748b", borderRadius: 10, padding: "11px 16px", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}
              {reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🏀</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "#64748b" }}>No reviews yet</div>
                  <div style={{ fontSize: 13, color: "#4a5568" }}>Be the first to review this court!</div>
                </div>
              ) : reviews.map((r, i) => (
                <div key={r.id || i} style={{ display: "flex", gap: 12, marginBottom: 18, paddingBottom: 18, borderBottom: i < reviews.length - 1 ? "1px solid #0f1923" : "none" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #1e3a5f, #F97316)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{(r.user_name || "?").slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{r.user_name}</span>
                      <span style={{ color: "#4a5568", fontSize: 12 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "Just now"}</span>
                    </div>
                    <StarRating rating={r.rating} />
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>{r.text}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          {tab === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 14, padding: "14px 18px" }}>
                <div style={{ color: "#4a5568", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Address</div>
                <div style={{ color: "#fff", fontSize: 14 }}>{court.address}</div>
              </div>
              <div style={{ background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 14, padding: "14px 18px" }}>
                <div style={{ color: "#4a5568", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Data Source</div>
                <div style={{ color: "#fff", fontSize: 14 }}>{court.source === "google" ? "📍 Google Maps" : court.source === "osm" ? "🗺 OpenStreetMap" : "👥 PickUp Community"}</div>
              </div>
              {court.totalRatings && (
                <div style={{ background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 14, padding: "14px 18px" }}>
                  <div style={{ color: "#4a5568", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Google Rating</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StarRating rating={Math.round(court.rating)} />
                    <span style={{ color: "#F97316", fontWeight: 700 }}>{court.rating?.toFixed(1)}</span>
                    <span style={{ color: "#4a5568", fontSize: 13 }}>({court.totalRatings} reviews)</span>
                  </div>
                </div>
              )}
              <a href={`https://www.google.com/maps/search/?api=1&query=${court.lat},${court.lng}`} target="_blank" rel="noreferrer"
                style={{ background: "#F97316", color: "#fff", borderRadius: 14, padding: "16px", fontFamily: "inherit", fontSize: 15, fontWeight: 700, textAlign: "center", textDecoration: "none", display: "block" }}>
                Open in Google Maps →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SubmitCourtModal = ({ userLocation, onClose, onSubmit }) => {
  const [form, setForm] = useState({ name: "", address: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [pinLocation, setPinLocation] = useState(userLocation);
  const [mode, setMode] = useState("pin");
  const [coords, setCoords] = useState({ lat: userLocation?.lat?.toFixed(6) || "", lng: userLocation?.lng?.toFixed(6) || "" });

  const handleMapClick = useCallback((e) => {
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;
    setPinLocation({ lat, lng });
    setCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
  }, []);

  const finalLocation = mode === "coords" ? { lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) } : pinLocation;
  const isValid = form.name && finalLocation && (mode === "pin" ? pinLocation : coords.lat && coords.lng && !isNaN(parseFloat(coords.lat)) && !isNaN(parseFloat(coords.lng)));

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("submitted_courts").insert([{ name: form.name, address: form.address || `${finalLocation.lat.toFixed(5)}, ${finalLocation.lng.toFixed(5)}`, lat: finalLocation.lat, lng: finalLocation.lng, description: form.description }]).select();
    if (!error && data) onSubmit(data[0]);
    setSubmitting(false);
    onClose();
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", padding: 20 }}>
      <div style={{ background: "#0a0f14", borderRadius: 20, width: "100%", maxWidth: 560, border: "1px solid #1a2530", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1a2530", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "0.05em" }}>Add a Court</div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 24, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ color: "#64748b", fontSize: 13 }}>Know a court that's not on the map? Add it for the community.</div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Set Location By</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ key: "pin", label: "📍 Drop Pin on Map" }, { key: "coords", label: "🔢 Enter Coordinates" }].map(({ key, label }) => (
                <button key={key} onClick={() => setMode(key)} style={{ flex: 1, background: mode === key ? "#F97316" : "#0f1923", border: `1px solid ${mode === key ? "#F97316" : "#1a2530"}`, color: mode === key ? "#fff" : "#64748b", borderRadius: 10, padding: "10px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{label}</button>
              ))}
            </div>
          </div>
          {mode === "pin" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>Tap the map to drop a pin exactly where the court is.</div>
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #1a2530", height: 220 }}>
                <Map defaultCenter={userLocation || { lat: 38.9072, lng: -77.0369 }} defaultZoom={15} mapId="submit-map" style={{ width: "100%", height: "100%" }} onClick={handleMapClick}
                  styles={[{ elementType: "geometry", stylers: [{ color: "#0a0f14" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#111b26" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#060d14" }] }, { featureType: "poi", stylers: [{ visibility: "off" }] }]}>
                  {pinLocation && <AdvancedMarker position={pinLocation}><div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F97316", border: "3px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 0 4px rgba(249,115,22,0.3)" }}>🏀</div></AdvancedMarker>}
                </Map>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: pinLocation ? "#F97316" : "#4a5568", fontWeight: pinLocation ? 600 : 400 }}>
                {pinLocation ? `📍 ${pinLocation.lat.toFixed(5)}, ${pinLocation.lng.toFixed(5)}` : "No pin dropped yet — tap the map above"}
              </div>
            </div>
          )}
          {mode === "coords" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>💡 Right-click any location on Google Maps — coordinates appear at the top of the menu.</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ key: "lat", label: "Latitude", placeholder: "38.123456" }, { key: "lng", label: "Longitude", placeholder: "-77.123456" }].map(({ key, label, placeholder }) => (
                  <div key={key} style={{ flex: 1 }}>
                    <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
                    <input value={coords[key]} onChange={e => setCoords(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 10, padding: "10px 14px", color: "#fff", fontFamily: "inherit", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {[{ key: "name", placeholder: "e.g. Oak Park Basketball Court", label: "Court Name *" }, { key: "address", placeholder: "Street address or landmark (optional)", label: "Address" }, { key: "description", placeholder: "Number of hoops, surface type, lighting, open hours...", label: "Description" }].map(({ key, placeholder, label }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
              {key === "description"
                ? <textarea value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} rows={3} style={{ width: "100%", background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 10, padding: "10px 14px", color: "#fff", fontFamily: "inherit", fontSize: 14, resize: "none", boxSizing: "border-box" }} />
                : <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 10, padding: "10px 14px", color: "#fff", fontFamily: "inherit", fontSize: 14, boxSizing: "border-box" }} />
              }
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #1a2530", display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={handleSubmit} disabled={submitting || !isValid} style={{ flex: 1, background: "#F97316", border: "none", color: "#fff", borderRadius: 10, padding: "13px", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: isValid ? "pointer" : "not-allowed", opacity: !isValid || submitting ? 0.5 : 1 }}>{submitting ? "Submitting..." : "Submit Court 🏀"}</button>
          <button onClick={onClose} style={{ background: "#0f1923", border: "1px solid #1e2d3d", color: "#64748b", borderRadius: 10, padding: "13px 18px", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── MapComponent emits onMapMoved + tracks zoom level ──────────────────
function MapComponent({ courts, selected, onSelect, userLocation, centerOn, onMapMoved, areaSearchLoading, onZoomChanged }) {
  const mapRef = useRef(null);
  const isInitialLoad = useRef(true);
  const isProgrammaticMove = useRef(false);
  const defaultCenter = userLocation || { lat: 38.9072, lng: -77.0369 };
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (centerOn && mapRef.current) {
      isProgrammaticMove.current = true;
      mapRef.current.panTo(centerOn);
      mapRef.current.setZoom(13);
    }
  }, [centerOn]);

  const handleIdle = useCallback((e) => {
    mapRef.current = e.map;
    const zoom = e.map.getZoom();
    const center = e.map.getCenter();
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      onZoomChanged(zoom);
      return;
    }
    if (isProgrammaticMove.current) {
      isProgrammaticMove.current = false;
      onZoomChanged(zoom);
      return;
    }
    if (center) onMapMoved({ lat: center.lat(), lng: center.lng() });
    onZoomChanged(zoom);
  }, [onMapMoved, onZoomChanged]);

  const markerColor = (court) => {
    if (court.source === "community") return { bg: "#7c3aed", border: "#a78bfa" };
    if (court.source === "osm") return { bg: "#0369a1", border: "#38bdf8" };
    return { bg: "#0f1923", border: "#F97316" };
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={13}
        mapId="pickup-map"
        style={{ width: "100%", height: "100%" }}
        onIdle={handleIdle}
        styles={[{ elementType: "geometry", stylers: [{ color: "#0a0f14" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#0a0f14" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#111b26" }] }, { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f1923" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#060d14" }] }, { featureType: "poi", stylers: [{ visibility: "off" }] }, { featureType: "transit", stylers: [{ visibility: "off" }] }]}
      >
        {userLocation && <AdvancedMarker position={userLocation}><div style={{ width: 14, height: 14, borderRadius: "50%", background: "#3b82f6", border: "2px solid #fff", boxShadow: "0 0 12px rgba(59,130,246,0.9)" }} /></AdvancedMarker>}
        {courts.map((court) => {
          const isSelected = selected?.place_id === court.place_id;
          const colors = markerColor(court);
          return (
            <AdvancedMarker key={court.place_id} position={{ lat: court.lat, lng: court.lng }} onClick={() => { onSelect(court); setInfoOpen(true); }}>
              <div style={{ width: isSelected ? 44 : 32, height: isSelected ? 44 : 32, borderRadius: "50%", background: isSelected ? "#F97316" : colors.bg, border: `2px solid ${isSelected ? "#fff" : colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isSelected ? 20 : 15, transition: "all 0.2s", boxShadow: isSelected ? "0 0 0 6px rgba(249,115,22,0.25)" : "0 2px 8px rgba(0,0,0,0.4)", cursor: "pointer" }}>🏀</div>
            </AdvancedMarker>
          );
        })}
        {selected && infoOpen && (
          <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => setInfoOpen(false)}>
            <div style={{ padding: "4px 2px", minWidth: 160 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: "#111" }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: "#F97316" }}>⭐ {selected.rating?.toFixed(1) || "—"} · {selected.distance} mi away</div>
            </div>
          </InfoWindow>
        )}
      </Map>

      {areaSearchLoading === "pending" && (
        <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
          <button
            onClick={() => onMapMoved({ trigger: "search" })}
            style={{ background: "#0a0f14", border: "1px solid #F97316", color: "#F97316", borderRadius: 24, padding: "10px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            🔍 Search this area
          </button>
        </div>
      )}
      {areaSearchLoading === "loading" && (
        <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
          <div style={{ background: "#0a0f14", border: "1px solid #1a2530", color: "#64748b", borderRadius: 24, padding: "10px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 20px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span> Finding courts...
          </div>
        </div>
      )}
    </div>
  );
}

function InnerApp({ courts, selected, setSelected, courtSearch, setCourtSearch, view, setView, userLocation, loading, searchLoading, locationName, onMapsLoaded, showSubmit, setShowSubmit, onCourtSubmitted, sourceFilter, setSourceFilter, onLocationSearch, onGoHome, mapCenter, onMapMoved, areaSearchLoading, mapZoom, onZoomChanged }) {
  const mapsLoadedRef = useRef(false);
  const [locationInput, setLocationInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const autocompleteService = useRef(null);
  const searchWrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (mapsLoadedRef.current) return;
    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        clearInterval(interval);
        mapsLoadedRef.current = true;
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        onMapsLoaded();
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback((value) => {
    if (!autocompleteService.current || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    autocompleteService.current.getPlacePredictions(
      { input: value, types: ["(cities)"] },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 6));
          setShowSuggestions(true);
          setActiveSuggestion(-1);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    );
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 120);
  };

  const handleSuggestionSelect = (suggestion) => {
    setLocationInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    setIsFocused(false);
    onLocationSearch(suggestion.description);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        handleSuggestionSelect(suggestions[activeSuggestion]);
      } else if (locationInput.trim()) {
        onLocationSearch(locationInput.trim());
        setLocationInput("");
        setShowSuggestions(false);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  const renderSuggestionText = (suggestion) => {
    const text = suggestion.description;
    const matched = suggestion.matched_substrings?.[0];
    if (!matched) return <span style={{ color: "#94a3b8" }}>{text}</span>;
    const before = text.slice(0, matched.offset);
    const bold = text.slice(matched.offset, matched.offset + matched.length);
    const after = text.slice(matched.offset + matched.length);
    return (
      <span style={{ color: "#94a3b8" }}>
        {before}<span style={{ color: "#fff", fontWeight: 700 }}>{bold}</span>{after}
      </span>
    );
  };

  const handleLogoClick = () => {
    setLocationInput("");
    setCourtSearch("");
    setSuggestions([]);
    setShowSuggestions(false);
    onGoHome();
  };

  // zoom < 11 = too far out (~25+ miles visible), show zoom-in nudge instead of courts
  const tooZoomedOut = mapZoom !== null && mapZoom < 11;

  const counts = { all: courts.length, google: courts.filter(c => c.source === "google").length, osm: courts.filter(c => c.source === "osm").length, community: courts.filter(c => c.source === "community").length };
  const displayed = sourceFilter === "all" ? courts : courts.filter(c => c.source === sourceFilter);
  const isLoading = loading || searchLoading || areaSearchLoading === "loading";

  return (
    <div style={{ minHeight: "100vh", background: "#06090d", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0f14; } ::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 4px; }
        input, textarea { outline: none; } input::placeholder, textarea::placeholder { color: #374151; }
        .logo-btn:hover { opacity: 0.85; transform: scale(0.98); }
        .suggestion-item:hover { background: #111d2b !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ background: "#06090d", borderBottom: "1px solid #0f1923", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 50 }}>
        <button className="logo-btn" onClick={handleLogoClick} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "4px 8px 4px 0", borderRadius: 8, transition: "all 0.15s" }}>
          <div style={{ width: 32, height: 32, background: "#F97316", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏀</div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "0.08em", color: "#fff" }}>PICKUP</span>
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setShowSubmit(true)} style={{ background: "#0f1923", border: "1px solid #F97316", color: "#F97316", borderRadius: 8, padding: "6px 12px", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Court</button>
          {["split", "map", "list"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "#F97316" : "#0f1923", border: `1px solid ${view === v ? "#F97316" : "#1a2530"}`, color: view === v ? "#fff" : "#64748b", borderRadius: 8, padding: "6px 12px", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Search area */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid #0f1923", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* City autocomplete search */}
        <div ref={searchWrapperRef} style={{ position: "relative", zIndex: 40 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1, display: "flex", alignItems: "center" }}>
                {searchLoading
                  ? <span style={{ fontSize: 14, display: "inline-block", animation: "spin 0.8s linear infinite" }}>⏳</span>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                }
              </div>
              <input
                value={locationInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => { setIsFocused(true); if (locationInput.length >= 2) setShowSuggestions(true); }}
                placeholder={searchLoading ? "Searching..." : "Search any city — New York, London, Tokyo..."}
                style={{
                  width: "100%",
                  background: isFocused ? "#0f1923" : "#0a0f14",
                  border: `1px solid ${isFocused ? "#F97316" : "#1e2d3d"}`,
                  borderRadius: showSuggestions && suggestions.length > 0 ? "10px 10px 0 0" : "10px",
                  padding: "10px 36px 10px 38px",
                  color: "#fff", fontFamily: "inherit", fontSize: 14,
                  transition: "border-color 0.15s, background 0.15s",
                }}
              />
              {locationInput && (
                <button
                  onClick={() => { setLocationInput(""); setSuggestions([]); setShowSuggestions(false); }}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "#1e2d3d", border: "none", color: "#94a3b8", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }}>×</button>
              )}
            </div>
            <button
              onClick={() => { if (locationInput.trim()) { onLocationSearch(locationInput.trim()); setLocationInput(""); setShowSuggestions(false); } }}
              disabled={searchLoading}
              style={{ background: "#F97316", border: "none", color: "#fff", borderRadius: 10, padding: "10px 20px", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", opacity: searchLoading ? 0.7 : 1, flexShrink: 0 }}>
              {searchLoading ? "Finding..." : "Find Courts"}
            </button>
          </div>

          {/* Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0,
              width: "calc(100% - 128px)",
              background: "#0f1923",
              border: "1px solid #F97316", borderTop: "1px solid #1a2530",
              borderRadius: "0 0 12px 12px",
              overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
              animation: "dropIn 0.15s ease",
            }}>
              {suggestions.map((s, i) => (
                <div
                  key={s.place_id}
                  className="suggestion-item"
                  onMouseDown={(e) => { e.preventDefault(); handleSuggestionSelect(s); }}
                  onMouseEnter={() => setActiveSuggestion(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
                    cursor: "pointer",
                    borderBottom: i < suggestions.length - 1 ? "1px solid #0a0f14" : "none",
                    background: activeSuggestion === i ? "#111d2b" : "transparent",
                    transition: "background 0.1s",
                  }}>
                  <div style={{
                    flexShrink: 0, width: 30, height: 30, borderRadius: 8,
                    background: activeSuggestion === i ? "#1a2d42" : "#0a0f14",
                    border: `1px solid ${activeSuggestion === i ? "#F97316" : "#1e2d3d"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.1s",
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={activeSuggestion === i ? "#F97316" : "#4a5568"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {renderSuggestionText(s)}
                    </div>
                    <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>
                      {s.structured_formatting?.secondary_text || "City"}
                    </div>
                  </div>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1e2d3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              ))}
              <div style={{ padding: "6px 16px", background: "#06090d", borderTop: "1px solid #0a0f14", display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span style={{ fontSize: 10, color: "#374151", letterSpacing: "0.02em" }}>Powered by Google</span>
              </div>
            </div>
          )}
        </div>

        {/* Court name filter + location label */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input value={courtSearch} onChange={e => setCourtSearch(e.target.value)} placeholder="Filter courts by name..." style={{ width: "100%", background: "#0a0f14", border: "1px solid #1a2530", borderRadius: 10, padding: "9px 12px 9px 34px", color: "#fff", fontFamily: "inherit", fontSize: 14 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#4a5568", fontSize: 12, whiteSpace: "nowrap" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ color: "#64748b" }}>{locationName}</span>
          </div>
        </div>

        {/* Source filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ key: "all", label: `All (${counts.all})`, color: "#F97316" }, { key: "google", label: `📍 Google (${counts.google})`, color: "#166534" }, { key: "osm", label: `🗺 OSM (${counts.osm})`, color: "#0369a1" }, { key: "community", label: `👥 Community (${counts.community})`, color: "#7c3aed" }].map(({ key, label, color }) => (
            <button key={key} onClick={() => setSourceFilter(key)} style={{ background: sourceFilter === key ? color : "#0a0f14", border: `1px solid ${sourceFilter === key ? color : "#1a2530"}`, color: sourceFilter === key ? "#fff" : "#64748b", borderRadius: 20, padding: "4px 12px", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ display: "grid", gridTemplateColumns: view === "list" ? "1fr" : view === "map" ? "1fr" : "380px 1fr", height: "calc(100vh - 180px)" }}>
        {view !== "map" && (
          <div style={{ overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, borderRight: "1px solid #0f1923" }}>
            <div style={{ color: "#4a5568", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {isLoading ? "🔍 Finding courts..." : tooZoomedOut ? "Zoom in to see courts" : `${displayed.length} courts found`}
            </div>

            {/* Skeleton cards while loading */}
            {isLoading && [1, 2, 3].map(i => (
              <div key={i} style={{ height: 180, borderRadius: 16, background: "#0a0f14", border: "1px solid #1a2530" }} />
            ))}

            {/* Zoom-in nudge */}
            {!isLoading && tooZoomedOut && (
              <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔭</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Zoom in to find courts</div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
                  The map is too zoomed out.<br />Zoom in or search a specific city to see courts.
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !tooZoomedOut && displayed.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏀</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>No courts found here</div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
                  Try panning the map and tapping<br /><span style={{ color: "#F97316", fontWeight: 600 }}>Search this area</span>
                </div>
              </div>
            )}

            {/* Court cards — hidden when too zoomed out */}
            {!isLoading && !tooZoomedOut && displayed.map(court => (
              <CourtCard key={court.place_id} court={court} onClick={setSelected} active={selected?.place_id === court.place_id} />
            ))}
          </div>
        )}
        {view !== "list" && (
          <div style={{ position: "relative" }}>
            <MapComponent
              courts={tooZoomedOut ? [] : displayed}
              selected={selected}
              onSelect={setSelected}
              userLocation={userLocation}
              centerOn={mapCenter}
              onMapMoved={onMapMoved}
              areaSearchLoading={areaSearchLoading}
              onZoomChanged={onZoomChanged}
            />
          </div>
        )}
      </div>

      {selected && <CourtDetail court={selected} onClose={() => setSelected(null)} />}
      {showSubmit && <SubmitCourtModal userLocation={userLocation} onClose={() => setShowSubmit(false)} onSubmit={onCourtSubmitted} />}
    </div>
  );
}

export default function PickUpApp() {
  const [courts, setCourts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [courtSearch, setCourtSearch] = useState("");
  const [view, setView] = useState("split");
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [locationName, setLocationName] = useState("Locating...");
  const [showSubmit, setShowSubmit] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [mapCenter, setMapCenter] = useState(null);
  const [areaSearchLoading, setAreaSearchLoading] = useState("idle");
  const [mapZoom, setMapZoom] = useState(13);
  const userLocationRef = useRef(null);
  const userLocationNameRef = useRef("Your Location");
  const pendingCenterRef = useRef(null);

  const fetchCourts = useCallback(async (lat, lng) => {
    if (!window.google?.maps?.places) return;
    const [googleCourts, osmCourts, submittedData] = await Promise.all([
      new Promise((resolve) => {
        const service = new window.google.maps.places.PlacesService(document.createElement("div"));
        service.nearbySearch({ location: new window.google.maps.LatLng(lat, lng), radius: 8000, keyword: "basketball court" }, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results.map(place => ({
              place_id: place.place_id, name: place.name, address: place.vicinity,
              lat: place.geometry.location.lat(), lng: place.geometry.location.lng(),
              rating: place.rating, totalRatings: place.user_ratings_total,
              openNow: place.opening_hours?.open_now,
              photo: place.photos?.[0]?.getUrl({ maxWidth: 600 }),
              distance: getDistanceMiles(lat, lng, place.geometry.location.lat(), place.geometry.location.lng()),
              source: "google",
            })));
          } else resolve([]);
        });
      }),
      fetchOSMCourts(lat, lng),
      supabase.from("submitted_courts").select("*"),
    ]);

    // Only show community courts within 25 miles of the searched location
    const communityCourts = (submittedData.data || [])
      .map(c => ({
        place_id: `community_${c.id}`, name: c.name, address: c.address || "Community submitted",
        lat: c.lat, lng: c.lng, distance: getDistanceMiles(lat, lng, c.lat, c.lng), source: "community",
      }))
      .filter(c => parseFloat(c.distance) <= 8);

    const deduped = osmCourts.filter(osm => !googleCourts.some(g => getDistanceMiles(osm.lat, osm.lng, g.lat, g.lng) < 0.05));
    setCourts([...googleCourts, ...deduped, ...communityCourts].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
    setLoading(false);
    setSearchLoading(false);
    setAreaSearchLoading("idle");
  }, []);

  const handleMapsLoaded = useCallback(() => {
    if (userLocationRef.current) fetchCourts(userLocationRef.current.lat, userLocationRef.current.lng);
  }, [fetchCourts]);

  const handleLocationSearch = useCallback(async (query) => {
    setSearchLoading(true);
    setCourts([]);
    setSelected(null);
    setAreaSearchLoading("idle");
    const result = await geocodeLocation(query);
    if (result) {
      setLocationName(result.label);
      setMapCenter({ lat: result.lat, lng: result.lng });
      await fetchCourts(result.lat, result.lng);
    } else {
      setSearchLoading(false);
      alert("Location not found — try a different city or address.");
    }
  }, [fetchCourts]);

  const handleGoHome = useCallback(() => {
    if (!userLocationRef.current) return;
    setSelected(null);
    setCourtSearch("");
    setSourceFilter("all");
    setSearchLoading(true);
    setCourts([]);
    setAreaSearchLoading("idle");
    setLocationName(userLocationNameRef.current);
    setMapCenter({ ...userLocationRef.current });
    fetchCourts(userLocationRef.current.lat, userLocationRef.current.lng);
  }, [fetchCourts]);

  const handleMapMoved = useCallback((center) => {
    if (center?.trigger === "search") {
      if (!pendingCenterRef.current) return;
      const { lat, lng } = pendingCenterRef.current;
      setAreaSearchLoading("loading");
      setCourts([]);
      setSelected(null);
      fetchCourts(lat, lng);
      return;
    }
    pendingCenterRef.current = center;
    setAreaSearchLoading("pending");
  }, [fetchCourts]);

  const handleZoomChanged = useCallback((zoom) => {
    setMapZoom(zoom);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        userLocationRef.current = loc;
        fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.lat},${loc.lng}&key=${MAPS_KEY}`)
          .then(r => r.json()).then(data => {
            const comps = data.results?.[0]?.address_components;
            const city = comps?.find(c => c.types.includes("locality"))?.long_name;
            const state = comps?.find(c => c.types.includes("administrative_area_level_1"))?.short_name;
            const name = city && state ? `${city}, ${state}` : "Your Location";
            setLocationName(name);
            userLocationNameRef.current = name;
          });
        if (window.google?.maps?.places) fetchCourts(loc.lat, loc.lng);
      },
      () => {
        const loc = { lat: 38.9072, lng: -77.0369 };
        setUserLocation(loc);
        userLocationRef.current = loc;
        setLocationName("Washington, DC");
        userLocationNameRef.current = "Washington, DC";
        if (window.google?.maps?.places) fetchCourts(loc.lat, loc.lng);
        else setLoading(false);
      }
    );
  }, [fetchCourts]);

  const filtered = courts.filter(c =>
    c.name.toLowerCase().includes(courtSearch.toLowerCase()) ||
    c.address?.toLowerCase().includes(courtSearch.toLowerCase())
  );

  const handleCourtSubmitted = (newCourt) => {
    const loc = userLocationRef.current || { lat: 38.9072, lng: -77.0369 };
    setCourts(prev => [{ place_id: `community_${newCourt.id}`, name: newCourt.name, address: newCourt.address || "Community submitted", lat: newCourt.lat, lng: newCourt.lng, distance: getDistanceMiles(loc.lat, loc.lng, newCourt.lat, newCourt.lng), source: "community" }, ...prev]);
  };

  return (
    <APIProvider apiKey={MAPS_KEY} libraries={["places"]}>
      <InnerApp
        courts={filtered}
        selected={selected}
        setSelected={setSelected}
        courtSearch={courtSearch}
        setCourtSearch={setCourtSearch}
        view={view}
        setView={setView}
        userLocation={userLocation}
        loading={loading}
        searchLoading={searchLoading}
        locationName={locationName}
        onMapsLoaded={handleMapsLoaded}
        showSubmit={showSubmit}
        setShowSubmit={setShowSubmit}
        onCourtSubmitted={handleCourtSubmitted}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        onLocationSearch={handleLocationSearch}
        onGoHome={handleGoHome}
        mapCenter={mapCenter}
        onMapMoved={handleMapMoved}
        areaSearchLoading={areaSearchLoading}
        mapZoom={mapZoom}
        onZoomChanged={handleZoomChanged}
      />
    </APIProvider>
  );
}

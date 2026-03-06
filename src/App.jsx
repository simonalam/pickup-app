import { useState, useEffect, useRef } from "react";

const COURTS = [
  {
    id: 1,
    name: "Riverside Basketball Courts",
    type: "Outdoor",
    hoops: 4,
    address: "Riverside Park, New York, NY",
    lat: 40.8003,
    lng: -73.9695,
    rating: 4.7,
    reviews: 128,
    tags: ["Lights", "Full Court", "Paved"],
    distance: "0.3 mi",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80",
    reviewList: [
      { user: "Marcus J.", rating: 5, text: "Best outdoor courts in the city. Always a good run here on weekends.", time: "2 days ago", avatar: "MJ" },
      { user: "Tyler R.", rating: 4, text: "Great hoops, pavement is a little cracked near hoop 3 but otherwise perfect.", time: "1 week ago", avatar: "TR" },
    ],
  },
  {
    id: 2,
    name: "West Side Rec Center",
    type: "Indoor",
    hoops: 6,
    address: "500 W 59th St, New York, NY",
    lat: 40.7711,
    lng: -73.9895,
    rating: 4.4,
    reviews: 89,
    tags: ["Indoor", "AC", "Locker Rooms"],
    distance: "0.8 mi",
    image: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=600&q=80",
    reviewList: [
      { user: "Devon S.", rating: 5, text: "Clean gym, great floor. Need a membership but worth it.", time: "3 days ago", avatar: "DS" },
    ],
  },
  {
    id: 3,
    name: "Harlem Courts - 155th St",
    type: "Outdoor",
    hoops: 8,
    address: "155th St & 8th Ave, New York, NY",
    lat: 40.8298,
    lng: -73.9396,
    rating: 4.9,
    reviews: 312,
    tags: ["Iconic", "Full Court", "Bleachers"],
    distance: "1.2 mi",
    image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=600&q=80",
    reviewList: [
      { user: "James K.", rating: 5, text: "Historic. If you're in NYC this is a bucket list court.", time: "5 days ago", avatar: "JK" },
      { user: "Chris M.", rating: 5, text: "Always elite competition here. Runs go all day.", time: "2 weeks ago", avatar: "CM" },
    ],
  },
  {
    id: 4,
    name: "East River Park Courts",
    type: "Outdoor",
    hoops: 2,
    address: "East River Park, New York, NY",
    lat: 40.7138,
    lng: -73.9756,
    rating: 4.1,
    reviews: 44,
    tags: ["Waterfront", "Half Court", "Free"],
    distance: "1.6 mi",
    image: "https://images.unsplash.com/photo-1519766304817-4f37bda74b38?w=600&q=80",
    reviewList: [
      { user: "Amir T.", rating: 4, text: "Half court only but the view is unbeatable. Good for solo practice.", time: "1 week ago", avatar: "AT" },
    ],
  },
  {
    id: 5,
    name: "Brooklyn Bridge Park Court",
    type: "Outdoor",
    hoops: 2,
    address: "Brooklyn Bridge Park, Brooklyn, NY",
    lat: 40.6985,
    lng: -73.9965,
    rating: 4.5,
    reviews: 67,
    tags: ["Scenic", "Paved", "Free"],
    distance: "2.1 mi",
    image: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&q=80",
    reviewList: [
      { user: "Nina P.", rating: 5, text: "Amazing view of Manhattan. Court itself is well maintained.", time: "4 days ago", avatar: "NP" },
    ],
  },
];

const StarRating = ({ rating, interactive = false, onRate }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => interactive && onRate && onRate(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{
            fontSize: interactive ? 22 : 14,
            cursor: interactive ? "pointer" : "default",
            color: s <= (hover || rating) ? "#F97316" : "#2a2a2a",
            transition: "color 0.15s",
          }}
        >★</span>
      ))}
    </div>
  );
};

const CourtCard = ({ court, onClick, active }) => (
  <div
    onClick={() => onClick(court)}
    style={{
      background: active ? "#0f1923" : "#0a0f14",
      border: `1px solid ${active ? "#F97316" : "#1a2530"}`,
      borderRadius: 16,
      overflow: "hidden",
      cursor: "pointer",
      transition: "all 0.2s ease",
      transform: active ? "scale(1.01)" : "scale(1)",
      boxShadow: active ? "0 0 0 2px #F97316" : "none",
    }}
  >
    <div style={{ position: "relative", height: 140 }}>
      <img src={court.image} alt={court.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 10, right: 10, background: court.type === "Indoor" ? "#1d4ed8" : "#166534", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, fontFamily: "inherit", letterSpacing: "0.05em" }}>
        {court.type.toUpperCase()}
      </div>
      <div style={{ position: "absolute", bottom: 10, left: 12, color: "#fff" }}>
        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>{court.name}</div>
      </div>
    </div>
    <div style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StarRating rating={Math.round(court.rating)} />
          <span style={{ color: "#F97316", fontWeight: 700, fontSize: 13 }}>{court.rating}</span>
          <span style={{ color: "#4a5568", fontSize: 12 }}>({court.reviews})</span>
        </div>
        <span style={{ color: "#F97316", fontSize: 12, fontWeight: 600 }}>{court.distance}</span>
      </div>
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>{court.address}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {court.tags.map(t => (
          <span key={t} style={{ background: "#0f1923", border: "1px solid #1e2d3d", color: "#94a3b8", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>{t}</span>
        ))}
      </div>
    </div>
  </div>
);

const MapView = ({ courts, selected, onSelect }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    // Dark map background
    ctx.fillStyle = "#0a0f14";
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "#0f1923";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Streets
    ctx.strokeStyle = "#111b26";
    ctx.lineWidth = 8;
    [[0.2, 0, 0.2, 1], [0.5, 0, 0.5, 1], [0.78, 0, 0.78, 1], [0, 0.3, 1, 0.3], [0, 0.6, 1, 0.6]].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath(); ctx.moveTo(x1 * w, y1 * h); ctx.lineTo(x2 * w, y2 * h); ctx.stroke();
    });

    // Court pins
    const positions = [[0.25, 0.35], [0.48, 0.55], [0.68, 0.22], [0.35, 0.70], [0.75, 0.65]];
    courts.forEach((court, i) => {
      const [px, py] = positions[i];
      const x = px * w;
      const y = py * h;
      const isSelected = selected?.id === court.id;
      const r = isSelected ? 18 : 13;

      // Pulse ring for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, r + 10, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(249,115,22,0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Pin circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? "#F97316" : "#1e3a5f";
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#fff" : "#F97316";
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.stroke();

      // Basketball icon
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${isSelected ? 14 : 10}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🏀", x, y);
    });
  }, [courts, selected]);

  const positions = [[0.25, 0.35], [0.48, 0.55], [0.68, 0.22], [0.35, 0.70], [0.75, 0.65]];

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid #1a2530" }}>
      <canvas ref={canvasRef} width={600} height={380} style={{ display: "block", width: "100%", height: "100%", cursor: "pointer" }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          courts.forEach((court, i) => {
            const [px, py] = positions[i];
            if (Math.abs(x - px) < 0.07 && Math.abs(y - py) < 0.1) onSelect(court);
          });
        }}
      />
      <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(10,15,20,0.9)", border: "1px solid #1a2530", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12 }}>
        📍 New York, NY
      </div>
      <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(10,15,20,0.9)", border: "1px solid #1a2530", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 11 }}>
        {courts.length} courts nearby
      </div>
    </div>
  );
};

const CourtDetail = ({ court, onClose, onAddReview }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ text: "", rating: 5, user: "" });
  const [tab, setTab] = useState("reviews");

  const handleSubmit = () => {
    if (!newReview.text || !newReview.user) return;
    onAddReview(court.id, { ...newReview, time: "Just now", avatar: newReview.user.slice(0, 2).toUpperCase() });
    setNewReview({ text: "", rating: 5, user: "" });
    setShowReviewForm(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0a0f14", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #1a2530", borderBottom: "none", animation: "slideUp 0.3s ease" }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        {/* Header image */}
        <div style={{ position: "relative", height: 200, flexShrink: 0 }}>
          <img src={court.image} alt={court.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0a0f14 0%, transparent 60%)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ position: "absolute", bottom: 16, left: 20 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#fff", letterSpacing: "0.05em", lineHeight: 1 }}>{court.name}</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{court.address}</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", padding: "14px 20px", gap: 20, borderBottom: "1px solid #1a2530", flexShrink: 0 }}>
          {[
            { label: "Rating", value: court.rating, sub: `${court.reviews} reviews` },
            { label: "Hoops", value: court.hoops, sub: "available" },
            { label: "Type", value: court.type, sub: "court" },
            { label: "Distance", value: court.distance, sub: "from you" },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ color: "#F97316", fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.05em" }}>{value}</div>
              <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 6, padding: "12px 20px", flexWrap: "wrap", flexShrink: 0 }}>
          {court.tags.map(t => (
            <span key={t} style={{ background: "#0f1923", border: "1px solid #1e2d3d", color: "#94a3b8", fontSize: 12, padding: "4px 12px", borderRadius: 20 }}>{t}</span>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1a2530", flexShrink: 0, padding: "0 20px" }}>
          {["reviews", "photos"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: tab === t ? "#F97316" : "#4a5568", fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: "10px 16px", cursor: "pointer", borderBottom: tab === t ? "2px solid #F97316" : "2px solid transparent", textTransform: "capitalize", letterSpacing: "0.03em" }}>{t}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px" }}>
          {tab === "reviews" && (
            <>
              {!showReviewForm ? (
                <button onClick={() => setShowReviewForm(true)} style={{ width: "100%", background: "#0f1923", border: "1px dashed #1e3a5f", color: "#F97316", borderRadius: 12, padding: "12px", fontFamily: "inherit", fontSize: 14, cursor: "pointer", marginBottom: 16, fontWeight: 600 }}>
                  + Write a Review
                </button>
              ) : (
                <div style={{ background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ marginBottom: 10 }}>
                    <StarRating rating={newReview.rating} interactive onRate={(r) => setNewReview(p => ({ ...p, rating: r }))} />
                  </div>
                  <input value={newReview.user} onChange={e => setNewReview(p => ({ ...p, user: e.target.value }))} placeholder="Your name" style={{ width: "100%", background: "#0a0f14", border: "1px solid #1e2d3d", borderRadius: 8, padding: "8px 12px", color: "#fff", fontFamily: "inherit", fontSize: 14, marginBottom: 8, boxSizing: "border-box" }} />
                  <textarea value={newReview.text} onChange={e => setNewReview(p => ({ ...p, text: e.target.value }))} placeholder="Share your experience..." rows={3} style={{ width: "100%", background: "#0a0f14", border: "1px solid #1e2d3d", borderRadius: 8, padding: "8px 12px", color: "#fff", fontFamily: "inherit", fontSize: 14, resize: "none", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={handleSubmit} style={{ flex: 1, background: "#F97316", border: "none", color: "#fff", borderRadius: 8, padding: "10px", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Post Review</button>
                    <button onClick={() => setShowReviewForm(false)} style={{ background: "#0a0f14", border: "1px solid #1e2d3d", color: "#64748b", borderRadius: 8, padding: "10px 16px", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}
              {court.reviewList.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center", color: "#F97316", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{r.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{r.user}</span>
                      <span style={{ color: "#4a5568", fontSize: 12 }}>{r.time}</span>
                    </div>
                    <StarRating rating={r.rating} />
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{r.text}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          {tab === "photos" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[court.image, court.image].map((img, i) => (
                <div key={i} style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "1", background: "#0f1923" }}>
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
              <div style={{ borderRadius: 10, border: "1px dashed #1e3a5f", aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#4a5568", cursor: "pointer", gap: 6 }}>
                <span style={{ fontSize: 24 }}>📷</span>
                <span style={{ fontSize: 12 }}>Add Photo</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function PickUpApp() {
  const [courts, setCourts] = useState(COURTS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("split");

  const filtered = courts.filter(c => {
    const matchFilter = filter === "All" || c.type === filter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.address.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const addReview = (courtId, review) => {
    setCourts(prev => prev.map(c => c.id === courtId ? { ...c, reviewList: [review, ...c.reviewList], reviews: c.reviews + 1 } : c));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#06090d", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0f14; } ::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 4px; }
        input, textarea { outline: none; }
        input::placeholder, textarea::placeholder { color: #374151; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#06090d", borderBottom: "1px solid #0f1923", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#F97316", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏀</div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "0.08em", color: "#fff" }}>PICKUP</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["split", "map", "list"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "#F97316" : "#0f1923", border: `1px solid ${view === v ? "#F97316" : "#1a2530"}`, color: view === v ? "#fff" : "#64748b", borderRadius: 8, padding: "6px 12px", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #0f1923", display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courts or locations..." style={{ width: "100%", background: "#0a0f14", border: "1px solid #1a2530", borderRadius: 10, padding: "9px 12px 9px 36px", color: "#fff", fontFamily: "inherit", fontSize: 14 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "Outdoor", "Indoor"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? "#F97316" : "#0a0f14", border: `1px solid ${filter === f ? "#F97316" : "#1a2530"}`, color: filter === f ? "#fff" : "#64748b", borderRadius: 10, padding: "9px 16px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: view === "list" ? "1fr" : view === "map" ? "1fr" : "1fr 1.2fr", gap: 0, height: "calc(100vh - 120px)" }}>

        {/* Court list */}
        {view !== "map" && (
          <div style={{ overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, borderRight: "1px solid #0f1923" }}>
            <div style={{ color: "#4a5568", fontSize: 13, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>
              {filtered.length} courts found near you
            </div>
            {filtered.map(court => (
              <CourtCard key={court.id} court={court} onClick={setSelected} active={selected?.id === court.id} />
            ))}
          </div>
        )}

        {/* Map */}
        {view !== "list" && (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <MapView courts={filtered} selected={selected} onSelect={setSelected} />
            {selected && view === "map" && (
              <div style={{ background: "#0a0f14", border: "1px solid #1a2530", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <img src={selected.image} style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.05em" }}>{selected.name}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{selected.distance} away · ⭐ {selected.rating}</div>
                </div>
                <button onClick={() => setSelected(selected)} style={{ background: "#F97316", border: "none", color: "#fff", borderRadius: 8, padding: "8px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>View</button>
              </div>
            )}
            <div style={{ color: "#1e2d3d", fontSize: 12, textAlign: "center" }}>Click a pin to select a court</div>
          </div>
        )}
      </div>

      {/* Court detail modal */}
      {selected && <CourtDetail court={selected} onClose={() => setSelected(null)} onAddReview={addReview} />}
    </div>
  );
}
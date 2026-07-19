import { JUNCTION_NAME, CITY } from '../config.js';

function Metric({ label, value, unit, note }) {
  return (
    <div className="metric">
      <span className="m-label">{label}</span>
      <span className="m-value">
        {value}<span className="m-unit"> {unit}</span>
      </span>
      {note && <span className="m-note">{note}</span>}
    </div>
  );
}

export default function HUD({
  stats, reading, isDemo, liveEnabled, setLiveEnabled,
  night, setNight, rain, setRain, cinematic, setCinematic,
  simSpeed, setSimSpeed, selected, setSelected,
}) {
  return (
    <>
      {/* ── left dock: network metrics ── */}
      <div className="hud panel dock-left">
        <div className="hud-title">{JUNCTION_NAME} · {CITY}</div>
        <div className="hud-sub">digital twin — {isDemo ? 'demo data' : 'live tomtom'}</div>
        <Metric label="network health" value={stats.health} unit="/100" />
        <div className="healthbar"><div style={{ width: `${stats.health}%` }} /></div>
        <Metric label="avg junction flow" value={stats.flow.toLocaleString()} unit="veh/hr" />
        <Metric label="avg delay / vehicle" value={stats.delay} unit="s" />
        <Metric label="idling CO₂" value={stats.co2} unit="kg/hr" note="modelled estimate" />
        <Metric label="idling fuel" value={stats.fuel} unit="L/hr" note="modelled estimate" />
      </div>

      {/* ── right dock: controls ── */}
      <div className="hud panel dock-right">
        <button className={liveEnabled && !isDemo ? 'on' : ''} onClick={() => setLiveEnabled(!liveEnabled)}>
          {liveEnabled ? (isDemo ? 'LIVE (falling back)' : 'LIVE') : 'DEMO'}
        </button>
        <button className={night ? 'on' : ''} onClick={() => setNight(!night)}>night</button>
        <button className={rain ? 'on' : ''} onClick={() => setRain(!rain)}>rain</button>
        <button className={cinematic ? 'on' : ''} onClick={() => setCinematic(!cinematic)}>cinematic</button>
        <div className="speed-row">
          {[1, 10, 60].map((s) => (
            <button key={s} className={simSpeed === s ? 'on' : ''} onClick={() => setSimSpeed(s)}>
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* ── demo banner ── */}
      {isDemo && (
        <div className="hud banner">
          Showing demo data — add your TomTom key for live traffic
        </div>
      )}

      {/* ── junction detail panel (click the central park) ── */}
      {selected && (
        <div className="hud panel dock-junction">
          <div className="hud-title">
            junction · cyber towers
            <button className="close" onClick={() => setSelected(false)}>×</button>
          </div>
          <Metric label="live speed" value={reading.currentSpeed} unit="km/h" />
          <Metric label="free-flow speed" value={reading.freeFlowSpeed} unit="km/h" />
          {reading.currentTravelTime != null && (
            <Metric label="segment travel time" value={reading.currentTravelTime} unit="s" />
          )}
          {reading.confidence != null && (
            <Metric label="confidence" value={Math.round(reading.confidence * 100)} unit="%" />
          )}
          <Metric label="road closure" value={reading.roadClosure ? 'YES' : 'no'} unit="" />
          <div className="divider" />
          <Metric label="sim vehicles" value={stats.vehicles} unit="" />
          <Metric label="sim queued (idling)" value={stats.idling} unit="veh" />
          <Metric label="sim avg speed ratio" value={stats.simRatio} unit="%" />
        </div>
      )}

      <div className="hud hint">drag to orbit · scroll to zoom · click the park for junction stats</div>
    </>
  );
}

import React, { useState } from 'react';
import './App.css';

function App() {
  const [aiTip, setAiTip] = useState(null); 
  const [activeTab, setActiveTab] = useState('profile');
  const [gender, setGender] = useState('male');
  const [goal, setGoal] = useState('maintain');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState('1.55');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [dishResult, setDishResult] = useState(null);
  const [log, setLog] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [mealPhoto, setMealPhoto] = useState(null);
  const [showLanding, setShowLanding] = useState(true);

  const calculateCalories = async () => {
    if (!age || !weight || !height) { alert('Please fill in all fields'); return; }
    try {
      const res = await fetch(
        `http://localhost:8080/api/calories?age=${age}&weight=${weight}&height=${height}&gender=${gender}&activityLevel=${activity}&goal=${goal}`,
        { method: 'GET' }
      );
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Backend not running! Make sure Spring Boot is started.');
    }
  };

  const handleMealPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMealPhoto(URL.createObjectURL(file));
  };

  const searchFood = async () => {
    if (!searchQuery) { alert('Please enter a food name'); return; }
    setScanning(true);
    setDishResult(null);
    try {
      const res = await fetch(`http://localhost:8080/api/search?query=${encodeURIComponent(searchQuery)}`);
      const raw = await res.json();
      const product = raw.products[0];
      if (!product) { alert('Food not found. Try a different name!'); setScanning(false); return; }
      const nutriments = product.nutriments;
      const q = parseFloat(quantity) || 100;
      const parsed = {
        name: product.product_name || searchQuery,
        calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
        protein: Math.round(nutriments['proteins_100g'] || 0),
        carbs: Math.round(nutriments['carbohydrates_100g'] || 0),
        fat: Math.round(nutriments['fat_100g'] || 0),
        fiber: Math.round(nutriments['fiber_100g'] || 0),
        image: product.image_front_small_url || product.image_url || null,
        adjustedCalories: Math.round((nutriments['energy-kcal_100g'] || 0) * q / 100),
        adjustedProtein: Math.round((nutriments['proteins_100g'] || 0) * q / 100),
        adjustedCarbs: Math.round((nutriments['carbohydrates_100g'] || 0) * q / 100),
        adjustedFat: Math.round((nutriments['fat_100g'] || 0) * q / 100),
      };
      setDishResult(parsed);
      getAiTip(parsed.name);
    } catch (err) {
      console.error('Search error:', err);
      alert('Error searching food. Make sure backend is running.');
    }
    setScanning(false);
  };

  const getAiTip = async (foodName) => {
    try {
      const res = await fetch(`http://localhost:8080/api/nutrition-tip?food=${encodeURIComponent(foodName)}`);
      const raw = await res.json();
      console.log('AI tip response:', raw);
      if (raw.text) {
        setAiTip(raw.text);
      }
    } catch (err) {
      console.error('AI tip error:', err);
    }
  };

  const addToLog = () => {
    if (!dishResult) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLog([...log, {
      name: dishResult.name,
      calories: dishResult.adjustedCalories,
      photo: mealPhoto,
      time
    }]);
    setActiveTab('log');
  };

  const eaten = log.reduce((s, i) => s + i.calories, 0);
  const target = result ? result.calories : null;
  const pct = target ? Math.min(Math.round((eaten / target) * 100), 100) : 0;

  return (
    <div className="app">
      {showLanding ? (
        <div className="landing">
          <div className="landing-content">
            <div className="landing-logo">cal<span>You</span></div>
            <div className="landing-tagline">Calories Don't Lift Themselves 💪</div>
            <button className="landing-btn" onClick={() => setShowLanding(false)}>
              Start Tracking →
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="header">
            <div>
              <div className="logo">cal<span>You</span></div>
              <div className="logo-sub">Calories Don't Lift Themselves 💪</div>
            </div>
            <div className="date-pill">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>

          <div className="tabs">
            {['profile', 'scan', 'log'].map(tab => (
              <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="content">
            {activeTab === 'profile' && (
              <div>
                <div className="grid2">
                  <div><label className="field-label">Age</label><input type="number" placeholder="25" value={age} onChange={e => setAge(e.target.value)} /></div>
                  <div><label className="field-label">Weight (kg)</label><input type="number" placeholder="70" value={weight} onChange={e => setWeight(e.target.value)} /></div>
                </div>
                <div className="grid2">
                  <div><label className="field-label">Height (cm)</label><input type="number" placeholder="175" value={height} onChange={e => setHeight(e.target.value)} /></div>
                  <div>
                    <label className="field-label">Gender</label>
                    <div className="toggle-group">
                      <button className={`toggle-btn ${gender === 'male' ? 'on' : ''}`} onClick={() => setGender('male')}>Male</button>
                      <button className={`toggle-btn ${gender === 'female' ? 'on' : ''}`} onClick={() => setGender('female')}>Female</button>
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label className="field-label">Activity level</label>
                  <select value={activity} onChange={e => setActivity(e.target.value)}>
                    <option value="1.2">Sedentary — little or no exercise</option>
                    <option value="1.375">Lightly active — 1–3 days/week</option>
                    <option value="1.55">Moderately active — 3–5 days/week</option>
                    <option value="1.725">Very active — 6–7 days/week</option>
                    <option value="1.9">Extra active — physical job</option>
                  </select>
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <label className="field-label">Goal</label>
                  <div className="toggle-group">
                    {['lose', 'maintain', 'gain'].map(g => (
                      <button key={g} className={`toggle-btn ${goal === g ? 'on' : ''}`} onClick={() => setGoal(g)}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="calc-btn" onClick={calculateCalories}>Calculate My Target</button>

                {result && (
                  <div className="result-panel">
                    <div className="result-hero">
                      <div className="result-hero-label">Daily calorie target</div>
                      <div className="result-hero-num">{result.calories.toLocaleString()}</div>
                      <div className="result-hero-unit">BMR {result.bmr} · TDEE {result.tdee} kcal</div>
                    </div>
                    <div className="macro-grid">
                      <div className="macro-cell"><div className="macro-num">{result.protein}g</div><div className="macro-lbl">Protein</div></div>
                      <div className="macro-cell"><div className="macro-num">{result.carbs}g</div><div className="macro-lbl">Carbs</div></div>
                      <div className="macro-cell"><div className="macro-num">{result.fat}g</div><div className="macro-lbl">Fat</div></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'scan' && (
              <div>
                <div style={{ marginBottom: '14px' }}>
                  <label className="field-label">Search a dish</label>
                  <input
                    type="text"
                    placeholder="e.g. pizza, banana, chicken rice..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchFood()}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label className="field-label">Quantity (grams)</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label className="field-label">Photo of your meal (optional)</label>
                  {mealPhoto && <img src={mealPhoto} alt="meal" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(0,0,0,0.4)', border: '0.5px dashed rgba(255,107,53,0.3)', borderRadius: '8px', padding: '10px 14px' }}>
                    <span style={{ fontSize: '20px' }}>📷</span>
                    <span style={{ fontSize: '13px', color: '#aaa' }}>{mealPhoto ? 'Change photo' : 'Add a photo of your meal'}</span>
                    <input type="file" accept="image/*" onChange={handleMealPhoto} style={{ display: 'none' }} />
                  </label>
                </div>
                <button className="calc-btn" onClick={searchFood} disabled={scanning}>
                  {scanning ? 'Searching...' : 'Search Food'}
                </button>

                {dishResult && (
                  <div className="result-panel">
                    <div className="result-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        {dishResult.image && (
                          <img src={dishResult.image} alt={dishResult.name} style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                        )}
                        <div className="result-hero-label">{dishResult.name}</div>
                        <div className="result-hero-num">{dishResult.adjustedCalories} <span style={{ fontSize: '16px' }}>kcal</span></div>
                        <div className="result-hero-unit">for {quantity || 100}g serving</div>
                      </div>
                      <button className="add-log-btn" onClick={addToLog} style={{ marginLeft: '12px' }}>+ Log it</button>
                    </div>
                    <div className="macro-grid">
                      <div className="macro-cell"><div className="macro-num">{dishResult.adjustedProtein}g</div><div className="macro-lbl">Protein</div></div>
                      <div className="macro-cell"><div className="macro-num">{dishResult.adjustedCarbs}g</div><div className="macro-lbl">Carbs</div></div>
                      <div className="macro-cell"><div className="macro-num">{dishResult.adjustedFat}g</div><div className="macro-lbl">Fat</div></div>
                    </div>
                    {aiTip && (
                      <div style={{ padding: '12px 16px', borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '11px', color: '#ff6b35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>🤖 AI Nutrition Tip</div>
                        <div style={{ fontSize: '13px', color: '#aaa', lineHeight: '1.7' }}>{aiTip}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'log' && (
              <div>
                <div className="log-stats">
                  <div className="log-stat"><div className="log-stat-val accent">{eaten}</div><div className="log-stat-lbl">Eaten kcal</div></div>
                  <div className="log-stat"><div className="log-stat-val">{target || '—'}</div><div className="log-stat-lbl">Target kcal</div></div>
                  <div className="log-stat"><div className="log-stat-val">{target ? Math.max(target - eaten, 0) : '—'}</div><div className="log-stat-lbl">Remaining</div></div>
                </div>
                <div className="progress-wrap">
                  <div className="progress-meta"><span>Daily progress</span><span>{target ? pct + '%' : '—'}</span></div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: pct + '%', background: eaten > target ? '#E24B4A' : '#ff6b35' }}></div></div>
                </div>
                <div className="meals-card">
                  <div className="meals-header"><div className="meals-title">Today's meals</div><div className="meals-count">{log.length} items</div></div>
                  {log.length === 0 ? (
                    <div className="empty-log"><div style={{ fontSize: '28px', marginBottom: '10px' }}>🍽</div><div className="empty-log-text">No meals logged yet.</div></div>
                  ) : (
                    log.map((item, i) => (
                      <div key={i} className="meal-row">
                        {item.photo && <img src={item.photo} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', marginRight: '10px' }} />}
                        <div className="meal-dot" style={{ display: item.photo ? 'none' : 'block' }}></div>
                        <div className="meal-info"><div className="meal-name">{item.name}</div><div className="meal-time">{item.time}</div></div>
                        <div className="meal-cal">{item.calories} kcal</div>
                        <button className="meal-remove" onClick={() => setLog(log.filter((_, j) => j !== i))}>×</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
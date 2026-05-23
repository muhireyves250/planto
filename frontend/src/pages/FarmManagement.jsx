import React, { useState, useEffect } from 'react';
import { farmApi } from '../api/farmApi';
import { 
  MapPin, 
  Plus, 
  Loader2, 
  Layers, 
  TrendingUp,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Save
} from 'lucide-react';

const FarmManagement = ({ user }) => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Create state
    const [isAdding, setIsAdding] = useState(false);
    const [newFarm, setNewFarm] = useState({
        farm_name: '',
        location: '',
        farm_size: ''
    });

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    // Active field state
    const [activeFarmId, setActiveFarmId] = useState(localStorage.getItem('planto_active_farm_id') || null);

    useEffect(() => {
        fetchFarms();
    }, []);

    const fetchFarms = async () => {
        try {
            setLoading(true);
            const data = await farmApi.getFarms();
            setFarms(data);
            
            if (data && data.length > 0) {
                // Keep the default farm size logic for the soil test
                const sizeNum = parseFloat(data[0].farm_size);
                if (!isNaN(sizeNum)) {
                    localStorage.setItem('planto_user_farm_size', sizeNum.toString());
                }
                
                // Set first farm as active if none is selected
                if (!localStorage.getItem('planto_active_farm_id')) {
                    handleSetActive(data[0].id);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const created = await farmApi.createFarm(newFarm);
            
            const sizeNum = parseFloat(newFarm.farm_size);
            if (!isNaN(sizeNum)) {
                localStorage.setItem('planto_user_farm_size', sizeNum.toString());
            }
            
            // If it's the first farm, make it active
            if (farms.length === 0) {
                handleSetActive(created.id);
            }
            
            setIsAdding(false);
            setNewFarm({ farm_name: '', location: '', farm_size: '' });
            fetchFarms();
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (id) => {
        try {
            const payload = {
                farm_name: editData.farm_name,
                location: editData.location,
                farm_size: editData.farm_size
            };
            await farmApi.updateFarm(id, payload);
            
            const sizeNum = parseFloat(editData.farm_size);
            if (activeFarmId === id && !isNaN(sizeNum)) {
                localStorage.setItem('planto_user_farm_size', sizeNum.toString());
            }
            
            setEditingId(null);
            fetchFarms();
        } catch (err) {
            console.error("Failed to update farm", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this field permanently?")) return;
        try {
            await farmApi.deleteFarm(id);
            if (activeFarmId === id) {
                localStorage.removeItem('planto_active_farm_id');
                setActiveFarmId(null);
            }
            fetchFarms();
        } catch (err) {
            console.error("Failed to delete farm", err);
        }
    };

    const handleSetActive = (id) => {
        setActiveFarmId(id);
        localStorage.setItem('planto_active_farm_id', id);
    };

    return (
        <div className="farm-management-compact animate-fade-in">
            {/* Header Area */}
            <div className="section-header-compact">
                <div className="header-meta">
                    <h3 className="section-title">Manage Fields</h3>
                    <p className="section-subtitle">Add, edit, or remove your registered land parcels.</p>
                </div>
                <button 
                    className={`btn-compact ${isAdding ? 'btn-danger' : 'btn-primary'}`} 
                    onClick={() => setIsAdding(!isAdding)}
                >
                    {isAdding ? <X size={14} /> : <Plus size={14} />}
                    {isAdding ? 'Cancel' : 'Add Field'}
                </button>
            </div>

            {/* Small Professional Cards Listing */}
            {loading ? (
                <div className="empty-state-compact">
                    <Loader2 size={24} className="lucide-spin" />
                    <p>Loading fields...</p>
                </div>
            ) : (
                <div className="fields-grid-compact">
                    {/* Compact Registration Form */}
                    {isAdding && (
                        <form onSubmit={handleCreate} className="compact-form animate-slide-down">
                            <div className="form-row">
                                <input 
                                    type="text" 
                                    className="compact-input" 
                                    placeholder="Field Name (e.g. North Plot)"
                                    value={newFarm.farm_name} 
                                    onChange={e => setNewFarm({...newFarm, farm_name: e.target.value})}
                                    required 
                                />
                                <input 
                                    type="text" 
                                    className="compact-input" 
                                    placeholder="Location"
                                    value={newFarm.location} 
                                    onChange={e => setNewFarm({...newFarm, location: e.target.value})}
                                />
                                <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
                                    <input 
                                        type="text" 
                                        className="compact-input" 
                                        placeholder="Size (Hectares)"
                                        value={newFarm.farm_size} 
                                        onChange={e => setNewFarm({...newFarm, farm_size: e.target.value})}
                                        style={{ flex: 1 }}
                                    />
                                    <button type="submit" className="btn-compact btn-primary" style={{ flexShrink: 0 }}>
                                        Save Field
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {farms.map(farm => {
                        const isActive = activeFarmId === farm.id;
                        const isEditing = editingId === farm.id;

                        return (
                            <div key={farm.id} className={`field-card-compact ${isActive ? 'active-card' : ''}`}>
                                
                                {isEditing ? (
                                    /* EDIT MODE */
                                    <div className="card-edit-mode">
                                        <input 
                                            type="text" 
                                            className="compact-input" 
                                            value={editData.farm_name} 
                                            onChange={e => setEditData({...editData, farm_name: e.target.value})}
                                            placeholder="Field Name"
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <input 
                                                type="text" 
                                                className="compact-input" 
                                                value={editData.location} 
                                                onChange={e => setEditData({...editData, location: e.target.value})}
                                                placeholder="Location"
                                            />
                                            <input 
                                                type="text" 
                                                className="compact-input" 
                                                style={{ width: '80px' }}
                                                value={editData.farm_size} 
                                                onChange={e => setEditData({...editData, farm_size: e.target.value})}
                                                placeholder="Size"
                                            />
                                        </div>
                                        <div className="edit-actions">
                                            <button onClick={() => setEditingId(null)} className="btn-icon btn-cancel"><X size={14} /></button>
                                            <button onClick={() => handleUpdate(farm.id)} className="btn-icon btn-save"><Save size={14} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    /* VIEW MODE */
                                    <>
                                        <div className="card-top-row">
                                            <div className="card-title-group">
                                                <h4 className="field-name">{farm.farm_name}</h4>
                                                {isActive ? (
                                                    <span className="badge-active">Active</span>
                                                ) : (
                                                    <span className="badge-inactive">Inactive</span>
                                                )}
                                            </div>
                                            <div className="card-actions">
                                                <button onClick={() => { setEditingId(farm.id); setEditData(farm); }} className="action-icon edit"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDelete(farm.id)} className="action-icon delete"><Trash2 size={14} /></button>
                                            </div>
                                        </div>

                                        <div className="card-details-row">
                                            <div className="detail-item">
                                                <MapPin size={12} />
                                                <span>{farm.location || 'No location'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <Layers size={12} />
                                                <span>{farm.farm_size ? `${farm.farm_size} HA` : 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="card-bottom-row">
                                            <div className="status-toggle-wrapper">
                                                <label className="toggle-switch">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isActive}
                                                        onChange={() => {
                                                            if (isActive) {
                                                                setActiveFarmId(null);
                                                                localStorage.removeItem('planto_active_farm_id');
                                                            } else {
                                                                handleSetActive(farm.id);
                                                            }
                                                        }}
                                                    />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                                <span className="toggle-label">{isActive ? 'Status: Active' : 'Status: Inactive'}</span>
                                            </div>
                                            
                                            <button className="btn-insight" onClick={() => window.location.href = '/'}>
                                                <TrendingUp size={12} /> Insights
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {farms.length === 0 && !isAdding && (
                        <div className="empty-state-compact">
                            <AlertTriangle size={24} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                            <p>No fields registered yet. Click "Add Field" to start.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Compact Professional Styles */}
            <style>{`
                .farm-management-compact {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .section-header-compact {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(0,0,0,0.06);
                    padding-bottom: 1rem;
                }

                .section-title {
                    font-family: var(--font-heading);
                    font-size: 1.2rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 0.15rem 0;
                }

                .section-subtitle {
                    font-size: 0.8rem;
                    color: #64748b;
                    margin: 0;
                }

                .btn-compact {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-compact.btn-primary {
                    background: #16a34a;
                    color: white;
                }
                .btn-compact.btn-primary:hover {
                    background: #15803d;
                }
                .btn-compact.btn-danger {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .compact-form {
                    background: #f8fafc;
                    border: 2px dashed #cbd5e1;
                    border-radius: 12px;
                    padding: 1rem;
                    flex-shrink: 0;
                }

                .form-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                }

                .compact-input {
                    flex: 1;
                    min-width: 150px;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.85rem;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    color: #334155;
                    outline: none;
                }
                .compact-input:focus {
                    border-color: #16a34a;
                    box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.1);
                }

                .fields-grid-compact {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    max-height: 280px;
                    overflow-y: auto;
                    padding-right: 0.5rem;
                }
                
                .fields-grid-compact::-webkit-scrollbar {
                    width: 6px;
                }
                .fields-grid-compact::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .fields-grid-compact::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .fields-grid-compact::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                .field-card-compact {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.85rem;
                    transition: all 0.2s;
                    position: relative;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                }

                .field-card-compact:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
                }

                .field-card-compact.active-card {
                    border: 1.5px solid #16a34a;
                    background: linear-gradient(to bottom right, #ffffff, #f0fdf4);
                }

                .card-top-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .card-title-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .field-name {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #0f172a;
                }

                .badge-active {
                    background: #dcfce7;
                    color: #166534;
                    font-size: 0.65rem;
                    font-weight: 800;
                    padding: 0.15rem 0.4rem;
                    border-radius: 4px;
                    text-transform: uppercase;
                }
                
                .badge-inactive {
                    background: #f1f5f9;
                    color: #64748b;
                    font-size: 0.65rem;
                    font-weight: 800;
                    padding: 0.15rem 0.4rem;
                    border-radius: 4px;
                    text-transform: uppercase;
                }

                .card-actions {
                    display: flex;
                    gap: 0.35rem;
                }

                .action-icon {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .action-icon.edit:hover { background: #f1f5f9; color: #3b82f6; }
                .action-icon.delete:hover { background: #fee2e2; color: #ef4444; }

                .card-details-row {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #64748b;
                }

                .card-bottom-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 0.25rem;
                    padding-top: 0.85rem;
                    border-top: 1px solid #f1f5f9;
                }

                .status-toggle-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 36px;
                    height: 20px;
                }

                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #cbd5e1;
                    transition: .3s;
                    border-radius: 34px;
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 14px;
                    width: 14px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .3s;
                    border-radius: 50%;
                }

                input:checked + .toggle-slider {
                    background-color: #16a34a;
                }

                input:checked + .toggle-slider:before {
                    transform: translateX(16px);
                }
                
                .toggle-label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #475569;
                }

                .btn-insight {
                    background: white;
                    border: 1px solid #cbd5e1;
                    color: #0f172a;
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 0.35rem 0.6rem;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    transition: all 0.2s;
                }
                .btn-insight:hover {
                    border-color: #16a34a;
                    color: #16a34a;
                }

                .card-edit-mode {
                    display: flex;
                    flex-direction: column;
                }

                .edit-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                }

                .btn-icon {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .btn-cancel { background: #f1f5f9; color: #475569; }
                .btn-save { background: #16a34a; color: white; }

                .empty-state-compact {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 2rem;
                    background: #f8fafc;
                    border: 1px dashed #cbd5e1;
                    border-radius: 12px;
                    color: #64748b;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                /* Animation */
                @keyframes slideDown {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-down {
                    animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default FarmManagement;

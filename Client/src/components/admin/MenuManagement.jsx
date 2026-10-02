import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const MenuManagement = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_per_guest: 0,
    min_guests: 0,
    max_guests: 0,
    event_types: '', // comma separated string for form
    features: '',    // newline separated string for form
    featured: false
  });

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/packages', authHeader());
      setPackages(res.data);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || '',
        price_per_guest: pkg.price_per_guest || 0,
        min_guests: pkg.min_guests || 0,
        max_guests: pkg.max_guests || 0,
        event_types: pkg.event_types ? pkg.event_types.join(', ') : '',
        features: pkg.features ? pkg.features.join('\n') : '',
        featured: pkg.featured || false
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: '',
        description: '',
        price_per_guest: 0,
        min_guests: 0,
        max_guests: 0,
        event_types: '',
        features: '',
        featured: false
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price_per_guest: Number(formData.price_per_guest),
      min_guests: Number(formData.min_guests),
      max_guests: Number(formData.max_guests),
      event_types: formData.event_types.split(',').map(s => s.trim()).filter(Boolean),
      features: formData.features.split('\n').map(s => s.trim()).filter(Boolean)
    };

    try {
      if (editingPackage) {
        await axios.put(`/api/packages/${editingPackage.id}`, payload, authHeader());
      } else {
        await axios.post('/api/packages', payload, authHeader());
      }
      setShowModal(false);
      fetchPackages();
    } catch (err) {
      console.error('Failed to save package:', err);
      alert('Error saving package');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      await axios.delete(`/api/packages/${id}`, authHeader());
      fetchPackages();
    } catch (err) {
      console.error('Failed to delete package:', err);
      alert('Error deleting package');
    }
  };

  if (loading) {
    return <div className="text-slate-400 py-10 text-center">Loading packages...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-4 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-base font-semibold text-white">Menu Packages</h2>
            <p className="text-xs text-slate-400 mt-1">Manage catering packages and their features.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="text-sm bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-4 py-2 rounded hover:bg-cyan-400/30 transition-colors"
          >
            + Add Package
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-white">
            <thead>
              <tr className="border-b border-[#1E2A45]">
                <th className="text-left py-2.5 px-4 font-medium text-white">Name</th>
                <th className="text-left py-2.5 px-4 font-medium text-white">Price/Guest</th>
                <th className="text-left py-2.5 px-4 font-medium text-white">Guests (Min-Max)</th>
                <th className="text-left py-2.5 px-4 font-medium text-white">Featured</th>
                <th className="text-left py-2.5 px-4 font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => (
                <tr key={pkg.id} className="border-b border-[#17233C] hover:bg-cyan-400/5">
                  <td className="py-2.5 px-4 font-medium text-cyan-100">{pkg.name}</td>
                  <td className="py-2.5 px-4">₱{pkg.price_per_guest}</td>
                  <td className="py-2.5 px-4">{pkg.min_guests} - {pkg.max_guests}</td>
                  <td className="py-2.5 px-4">
                    {pkg.featured ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gold-400/10 text-gold-300 border border-gold-400/30">
                        Yes
                      </span>
                    ) : 'No'}
                  </td>
                  <td className="py-2.5 px-4">
                    <button
                      onClick={() => handleOpenModal(pkg)}
                      className="text-cyan-300 hover:text-cyan-100 text-xs font-medium mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="text-red-300 hover:text-red-100 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-white">No packages found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#1E2A45] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                {editingPackage ? 'Edit Package' : 'Add Package'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Price per Guest (₱)</label>
                  <input
                    type="number"
                    required
                    value={formData.price_per_guest}
                    onChange={e => setFormData({...formData, price_per_guest: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Min Guests</label>
                  <input
                    type="number"
                    required
                    value={formData.min_guests}
                    onChange={e => setFormData({...formData, min_guests: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Max Guests</label>
                  <input
                    type="number"
                    required
                    value={formData.max_guests}
                    onChange={e => setFormData({...formData, max_guests: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50 min-h-[60px]"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Event Types (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Wedding, Birthday, Corporate"
                  value={formData.event_types}
                  onChange={e => setFormData({...formData, event_types: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Features (one per line)</label>
                <textarea
                  value={formData.features}
                  onChange={e => setFormData({...formData, features: e.target.value})}
                  placeholder="Choice of 2 main dishes&#10;1 dessert option"
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50 min-h-[100px]"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-pkg"
                  checked={formData.featured}
                  onChange={e => setFormData({...formData, featured: e.target.checked})}
                  className="rounded border-[#1E2A45] bg-[#0B1220] text-cyan-400 focus:ring-cyan-400/50"
                />
                <label htmlFor="featured-pkg" className="text-sm text-white">Featured Package</label>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-[#1E2A45]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded hover:bg-cyan-400/30 transition-colors font-medium"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;

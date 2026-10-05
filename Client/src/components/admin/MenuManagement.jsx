import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { getFoodImage } from '../../data/foodImages';
import { formatCurrency } from '../../utils/helpers';
import {
  getFoods,
  updateFoodPrice,
  updateFood,
  createFood,
  toggleFoodAvailability,
  batchUpdatePrices,
  deleteFood,
} from '../../services/foodService';

const CATEGORY_TABS = [
  { key: 'all', label: 'All Items' },
  { key: 'mains', label: 'Main Dishes' },
  { key: 'specials', label: 'Specials' },
  { key: 'sides', label: 'Sides & Desserts' },
  { key: 'drinks', label: 'Drinks' },
  { key: 'fruits', label: 'Fruits' },
  { key: 'appetizers', label: 'Appetizers' },
];

const SUBCATEGORIES = {
  mains: ['All', 'Pork', 'Chicken', 'Beef', 'Seafood'],
  sides: ['All', 'Vegetables', 'Soup', 'Noodles', 'Dessert', 'Pasta'],
  drinks: ['All', 'Beverage'],
  fruits: ['All', 'Fruits'],
  appetizers: ['All', 'Appetizer'],
  specials: ['All', 'Specialty', 'Roast'],
};

const MenuManagement = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('foods'); // 'foods' or 'packages'

  // --- Foods State ---
  const [foods, setFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(true);
  const [foodSearch, setFoodSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [editingPriceMap, setEditingPriceMap] = useState({}); // { [id]: { price, chafer_price } }
  const [savingPriceId, setSavingPriceId] = useState(null);

  // Modals
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    category: 'mains',
    subcategory: 'Pork',
    price: 1300,
    chafer_price: 1500,
    description: '',
    image_id: '',
    is_available: true,
  });

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchCategory, setBatchCategory] = useState('mains');
  const [batchBasePrice, setBatchBasePrice] = useState(1300);
  const [batchChaferPrice, setBatchChaferPrice] = useState(1500);
  const [batchBusy, setBatchBusy] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  // --- Packages State ---
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [pkgFormData, setPkgFormData] = useState({
    name: '',
    description: '',
    price_per_guest: 0,
    min_guests: 0,
    max_guests: 0,
    event_types: '',
    features: '',
    featured: false,
  });

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
  });

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    fetchFoodList();
    fetchPackages();
  }, []);

  // --- Food Functions ---
  const fetchFoodList = async (force = false) => {
    setFoodsLoading(true);
    try {
      const data = await getFoods({ forceRefresh: force });
      setFoods(data || []);
      // Initialize edit price map
      const initialMap = {};
      (data || []).forEach((f) => {
        initialMap[f.id] = {
          price: f.price,
          chafer_price: f.chafer_price != null ? f.chafer_price : '',
        };
      });
      setEditingPriceMap(initialMap);
    } catch (err) {
      console.error('Failed to load foods:', err);
      showToast('Failed to load food list', 'error');
    } finally {
      setFoodsLoading(false);
    }
  };

  const handlePriceChange = (id, field, value) => {
    setEditingPriceMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveInlinePrice = async (food) => {
    const editValues = editingPriceMap[food.id];
    if (!editValues) return;

    const newPrice = Number(editValues.price);
    if (!Number.isFinite(newPrice) || newPrice < 0) {
      showToast('Please enter a valid base price', 'error');
      return;
    }

    const newChafer =
      editValues.chafer_price !== '' && editValues.chafer_price !== null && editValues.chafer_price !== undefined
        ? Number(editValues.chafer_price)
        : null;

    setSavingPriceId(food.id);
    try {
      await updateFoodPrice(food.id, { price: newPrice, chafer_price: newChafer });
      setFoods((prev) =>
        prev.map((f) => (f.id === food.id ? { ...f, price: newPrice, chafer_price: newChafer } : f))
      );
      showToast(`Price for "${food.name}" updated to ₱${newPrice.toLocaleString()}`);
    } catch (err) {
      console.error('Failed to update price:', err);
      showToast('Failed to update price', 'error');
    } finally {
      setSavingPriceId(null);
    }
  };

  const handleToggleAvailability = async (food) => {
    const newStatus = !food.is_available;
    try {
      await toggleFoodAvailability(food.id, newStatus);
      setFoods((prev) =>
        prev.map((f) => (f.id === food.id ? { ...f, is_available: newStatus } : f))
      );
      showToast(`"${food.name}" marked as ${newStatus ? 'Available' : 'Unavailable'}`);
    } catch (err) {
      console.error('Failed to update availability:', err);
      showToast('Failed to change status', 'error');
    }
  };

  const handleOpenFoodModal = (food = null) => {
    if (food) {
      setEditingFood(food);
      setFoodForm({
        name: food.name,
        category: food.category || 'mains',
        subcategory: food.subcategory || 'Pork',
        price: food.price || 0,
        chafer_price: food.chafer_price != null ? food.chafer_price : '',
        description: food.description || '',
        image_id: food.image_id || '',
        is_available: food.is_available ?? true,
      });
    } else {
      setEditingFood(null);
      setFoodForm({
        name: '',
        category: selectedCategory !== 'all' ? selectedCategory : 'mains',
        subcategory: selectedSubcategory !== 'All' ? selectedSubcategory : 'Pork',
        price: 1300,
        chafer_price: 1500,
        description: '',
        image_id: '',
        is_available: true,
      });
    }
    setShowFoodModal(true);
  };

  const handleSubmitFoodForm = async (e) => {
    e.preventDefault();
    const payload = {
      ...foodForm,
      price: Number(foodForm.price),
      chafer_price: foodForm.chafer_price !== '' && foodForm.chafer_price !== null ? Number(foodForm.chafer_price) : null,
      is_available: Boolean(foodForm.is_available),
    };

    try {
      if (editingFood) {
        await updateFood(editingFood.id, payload);
        showToast(`Updated "${payload.name}" successfully`);
      } else {
        await createFood(payload);
        showToast(`Added "${payload.name}" to menu`);
      }
      setShowFoodModal(false);
      fetchFoodList(true);
    } catch (err) {
      console.error('Failed to save food:', err);
      showToast('Failed to save food item', 'error');
    }
  };

  const handleDeleteFood = async (food) => {
    if (!confirm(`Are you sure you want to delete "${food.name}" from the menu?`)) return;
    try {
      await deleteFood(food.id);
      setFoods((prev) => prev.filter((f) => f.id !== food.id));
      showToast(`Deleted "${food.name}"`);
    } catch (err) {
      console.error('Failed to delete food:', err);
      showToast('Failed to delete food item', 'error');
    }
  };

  const handleBatchUpdateSubmit = async (e) => {
    e.preventDefault();
    setBatchBusy(true);
    try {
      const payload = {
        category: batchCategory,
        price: Number(batchBasePrice),
        chafer_price: batchChaferPrice !== '' && batchChaferPrice !== null ? Number(batchChaferPrice) : null,
      };
      await batchUpdatePrices(payload);
      showToast(`All ${batchCategory} updated to ₱${Number(batchBasePrice).toLocaleString()}`);
      setShowBatchModal(false);
      fetchFoodList(true);
    } catch (err) {
      console.error('Failed batch update:', err);
      showToast('Failed to batch update prices', 'error');
    } finally {
      setBatchBusy(false);
    }
  };

  // --- Packages Functions ---
  const fetchPackages = async () => {
    setPackagesLoading(true);
    try {
      const res = await axios.get('/api/packages', authHeader());
      setPackages(res.data);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleOpenPkgModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPkgFormData({
        name: pkg.name,
        description: pkg.description || '',
        price_per_guest: pkg.price_per_guest || 0,
        min_guests: pkg.min_guests || 0,
        max_guests: pkg.max_guests || 0,
        event_types: pkg.event_types ? pkg.event_types.join(', ') : '',
        features: pkg.features ? pkg.features.join('\n') : '',
        featured: pkg.featured || false,
      });
    } else {
      setEditingPackage(null);
      setPkgFormData({
        name: '',
        description: '',
        price_per_guest: 0,
        min_guests: 0,
        max_guests: 0,
        event_types: '',
        features: '',
        featured: false,
      });
    }
    setShowPkgModal(true);
  };

  const handleSubmitPkg = async (e) => {
    e.preventDefault();
    const payload = {
      ...pkgFormData,
      price_per_guest: Number(pkgFormData.price_per_guest),
      min_guests: Number(pkgFormData.min_guests),
      max_guests: Number(pkgFormData.max_guests),
      event_types: pkgFormData.event_types.split(',').map((s) => s.trim()).filter(Boolean),
      features: pkgFormData.features.split('\n').map((s) => s.trim()).filter(Boolean),
    };

    try {
      if (editingPackage) {
        await axios.put(`/api/packages/${editingPackage.id}`, payload, authHeader());
        showToast('Package updated successfully');
      } else {
        await axios.post('/api/packages', payload, authHeader());
        showToast('Package created successfully');
      }
      setShowPkgModal(false);
      fetchPackages();
    } catch (err) {
      console.error('Failed to save package:', err);
      showToast('Error saving package', 'error');
    }
  };

  const handleDeletePkg = async (id) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      await axios.delete(`/api/packages/${id}`, authHeader());
      showToast('Package deleted');
      fetchPackages();
    } catch (err) {
      console.error('Failed to delete package:', err);
      showToast('Error deleting package', 'error');
    }
  };

  // Filtered foods
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      // Category filter
      if (selectedCategory !== 'all' && food.category !== selectedCategory) {
        return false;
      }
      // Subcategory filter
      if (selectedSubcategory !== 'All' && food.subcategory !== selectedSubcategory) {
        return false;
      }
      // Search filter
      if (foodSearch.trim()) {
        const q = foodSearch.toLowerCase();
        const matchName = food.name.toLowerCase().includes(q);
        const matchSub = (food.subcategory || '').toLowerCase().includes(q);
        const matchCat = (food.category || '').toLowerCase().includes(q);
        return matchName || matchSub || matchCat;
      }
      return true;
    });
  }, [foods, selectedCategory, selectedSubcategory, foodSearch]);

  // Statistics
  const stats = useMemo(() => {
    const total = foods.length;
    const mains = foods.filter((f) => f.category === 'mains').length;
    const sides = foods.filter((f) => f.category === 'sides').length;
    const available = foods.filter((f) => f.is_available).length;
    return { total, mains, sides, available };
  }, [foods]);

  const activeSubcategories = useMemo(() => {
    if (selectedCategory === 'all') return [];
    return SUBCATEGORIES[selectedCategory] || [];
  }, [selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm transition-all duration-300 animate-slide-up ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : 'bg-[#101A2E]/95 text-cyan-200 border-cyan-400/40 shadow-[0_0_25px_-5px_rgba(34,211,238,0.3)]'
          }`}
        >
          <span>{toastMessage.type === 'error' ? '⚠️' : '✅'}</span>
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Main Section Header & Switcher */}
      <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-5 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-wide">Menu &amp; Pricing Management</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                Admin Control
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Control food item prices, chafer container rates, availability, and catering packages.
            </p>
          </div>

          {/* Section Tab Switcher */}
          <div className="flex items-center gap-2 bg-[#0B1220] p-1 rounded-lg border border-[#1E2A45]">
            <button
              onClick={() => setActiveSection('foods')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeSection === 'foods'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🍲</span>
              <span>Food &amp; Dish Prices</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300">
                {foods.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSection('packages')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeSection === 'packages'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📦</span>
              <span>Catering Packages</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-300">
                {packages.length}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Stat Highlights */}
        {activeSection === 'foods' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1E2A45]">
            <div className="bg-[#0B1220]/60 border border-[#1E2A45]/80 rounded-lg p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Total Food Items</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{stats.total} dishes</span>
            </div>
            <div className="bg-[#0B1220]/60 border border-[#1E2A45]/80 rounded-lg p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Main Platters</span>
              <span className="text-lg font-bold text-cyan-300 mt-0.5 block">{stats.mains} items</span>
            </div>
            <div className="bg-[#0B1220]/60 border border-[#1E2A45]/80 rounded-lg p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Sides &amp; Desserts</span>
              <span className="text-lg font-bold text-emerald-300 mt-0.5 block">{stats.sides} items</span>
            </div>
            <div className="bg-[#0B1220]/60 border border-[#1E2A45]/80 rounded-lg p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Currently Available</span>
              <span className="text-lg font-bold text-amber-300 mt-0.5 block">{stats.available} active</span>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: FOOD & DISH PRICES CONTROLS                   */}
      {/* ======================================================== */}
      {activeSection === 'foods' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Category Tabs & Action Buttons */}
          <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-4 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search dishes by name (e.g. Beef Steak, Pork, Lechon)..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-[#0B1220] border border-[#1E2A45] text-white text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all placeholder:text-slate-500"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
                {foodSearch && (
                  <button
                    onClick={() => setFoodSearch('')}
                    className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="text-xs bg-amber-500/10 text-amber-300 border border-amber-400/30 px-3.5 py-2 rounded-lg hover:bg-amber-400/20 transition-all flex items-center gap-1.5 font-medium"
                >
                  <span>⚡</span>
                  <span>Batch Price Adjust</span>
                </button>
                <button
                  onClick={() => handleOpenFoodModal()}
                  className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-3.5 py-2 rounded-lg hover:bg-cyan-400/30 transition-all flex items-center gap-1.5 font-medium"
                >
                  <span>+</span>
                  <span>Add New Dish</span>
                </button>
                <button
                  onClick={() => fetchFoodList(true)}
                  disabled={foodsLoading}
                  className="text-xs border border-slate-700 text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-all"
                  title="Refresh list"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
              {CATEGORY_TABS.map((tab) => {
                const count =
                  tab.key === 'all'
                    ? foods.length
                    : foods.filter((f) => f.category === tab.key).length;
                const isSelected = selectedCategory === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setSelectedCategory(tab.key);
                      setSelectedSubcategory('All');
                    }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-sm'
                        : 'border-[#1E2A45] text-slate-400 bg-[#0B1220]/70 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Subcategory Pills (if available) */}
            {activeSubcategories.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-[#1E2A45]/60 overflow-x-auto text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Subcategory:</span>
                {activeSubcategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      selectedSubcategory === sub
                        ? 'bg-gold-500/20 text-amber-300 font-semibold border border-amber-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Food Pricing Table */}
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-gray-800">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold w-16">Image</th>
                    <th className="text-left py-3 px-4 font-semibold">Dish Name &amp; Category</th>
                    <th className="text-left py-3 px-4 font-semibold w-40">
                      Standard Price (₱)
                      <span className="block text-[10px] font-normal text-gray-500">Base / Platter</span>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold w-40">
                      Chafer Price (₱)
                      <span className="block text-[10px] font-normal text-gray-500">With Container</span>
                    </th>
                    <th className="text-center py-3 px-3 font-semibold w-28">Status</th>
                    <th className="text-right py-3 px-4 font-semibold w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {foodsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="animate-spin text-2xl">⏳</span>
                          <span>Loading food menu items &amp; pricing...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredFoods.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        No food items found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredFoods.map((food) => {
                      const editValues = editingPriceMap[food.id] || {
                        price: food.price,
                        chafer_price: food.chafer_price != null ? food.chafer_price : '',
                      };
                      const priceDirty =
                        Number(editValues.price) !== Number(food.price) ||
                        (editValues.chafer_price === '' ? null : Number(editValues.chafer_price)) !==
                          food.chafer_price;
                      const isSaving = savingPriceId === food.id;
                      const imageSrc = getFoodImage(food.image_id || food.name);

                      return (
                        <tr
                          key={food.id}
                          className={`hover:bg-amber-50/40 transition-colors ${
                            !food.is_available ? 'opacity-60 bg-gray-50/50' : ''
                          }`}
                        >
                          {/* Thumbnail */}
                          <td className="py-2.5 px-4">
                            <div className="h-11 w-11 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shadow-xs">
                              {imageSrc ? (
                                <img
                                  src={imageSrc}
                                  alt={food.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="text-lg">🍽️</span>
                              )}
                            </div>
                          </td>

                          {/* Name & Categories */}
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-gray-900 text-sm">{food.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                                {food.category}
                              </span>
                              {food.subcategory && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                  {food.subcategory}
                                </span>
                              )}
                            </div>
                            {food.description && (
                              <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 max-w-sm">
                                {food.description}
                              </p>
                            )}
                          </td>

                          {/* Base / Platter Price Input */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500 font-semibold text-sm">₱</span>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={editValues.price}
                                onChange={(e) => handlePriceChange(food.id, 'price', e.target.value)}
                                className={`w-24 px-2 py-1 text-xs font-bold rounded border focus:outline-none focus:ring-2 transition-all ${
                                  priceDirty
                                    ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-400'
                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-cyan-500'
                                }`}
                              />
                            </div>
                          </td>

                          {/* Chafer Price Input */}
                          <td className="py-2.5 px-4">
                            {['mains', 'sides'].includes(food.category) ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-500 font-semibold text-sm">₱</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="10"
                                  placeholder="None"
                                  value={editValues.chafer_price}
                                  onChange={(e) =>
                                    handlePriceChange(food.id, 'chafer_price', e.target.value)
                                  }
                                  className={`w-24 px-2 py-1 text-xs font-bold rounded border focus:outline-none focus:ring-2 transition-all ${
                                    priceDirty
                                      ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-400'
                                      : 'border-gray-300 bg-white text-gray-900 focus:ring-cyan-500'
                                  }`}
                                />
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs italic">N/A</span>
                            )}
                          </td>

                          {/* Availability Toggle */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleToggleAvailability(food)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                food.is_available
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                              }`}
                            >
                              {food.is_available ? 'Available' : 'Out of Stock'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {priceDirty && (
                                <button
                                  onClick={() => handleSaveInlinePrice(food)}
                                  disabled={isSaving}
                                  className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-all"
                                  title="Save price change"
                                >
                                  {isSaving ? 'Saving...' : 'Save Price'}
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenFoodModal(food)}
                                className="text-cyan-700 hover:text-cyan-900 text-xs font-medium px-1.5 py-1 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteFood(food)}
                                className="text-red-600 hover:text-red-800 text-xs font-medium px-1.5 py-1 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between text-xs text-gray-600">
              <span>
                Showing <strong>{filteredFoods.length}</strong> of <strong>{foods.length}</strong> dishes
              </span>
              <span className="text-[11px] text-gray-500">
                💡 Tip: Type in a new price and click &quot;Save Price&quot; to immediately update live customer pricing.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: CATERING PACKAGES CONTROLS                    */}
      {/* ======================================================== */}
      {activeSection === 'packages' && (
        <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-4 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Menu Packages</h2>
              <p className="text-xs text-slate-400 mt-1">Manage catering packages, guest counts, and package features.</p>
            </div>
            <button
              onClick={() => handleOpenPkgModal()}
              className="text-sm bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-4 py-2 rounded-lg hover:bg-cyan-400/30 transition-colors"
            >
              + Add Package
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm mt-4">
            <table className="w-full text-sm text-gray-800">
              <thead className="bg-gray-50 text-gray-700">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2.5 px-4 font-medium">Name</th>
                  <th className="text-left py-2.5 px-4 font-medium">Price/Guest</th>
                  <th className="text-left py-2.5 px-4 font-medium">Guests (Min-Max)</th>
                  <th className="text-left py-2.5 px-4 font-medium">Featured</th>
                  <th className="text-right py-2.5 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packagesLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">Loading packages...</td>
                  </tr>
                ) : (
                  packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-gray-900">{pkg.name}</td>
                      <td className="py-2.5 px-4 font-medium text-gold-600">₱{pkg.price_per_guest}</td>
                      <td className="py-2.5 px-4 text-gray-600">{pkg.min_guests} - {pkg.max_guests}</td>
                      <td className="py-2.5 px-4">
                        {pkg.featured ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenPkgModal(pkg)}
                          className="text-cyan-600 hover:text-cyan-800 text-xs font-medium mr-3 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePkg(pkg.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {packages.length === 0 && !packagesLoading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">No packages found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT FOOD DISH MODAL                      */}
      {/* ======================================================== */}
      {showFoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#1E2A45] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                {editingFood ? `Edit "${editingFood.name}"` : 'Add New Dish to Menu'}
              </h3>
              <button onClick={() => setShowFoodModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitFoodForm} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pork Humba Special"
                  value={foodForm.name}
                  onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Category *</label>
                  <select
                    value={foodForm.category}
                    onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-sm"
                  >
                    <option value="mains">Main Dishes (mains)</option>
                    <option value="specials">Specials (specials)</option>
                    <option value="sides">Sides &amp; Desserts (sides)</option>
                    <option value="drinks">Drinks (drinks)</option>
                    <option value="fruits">Fruits (fruits)</option>
                    <option value="appetizers">Appetizers (appetizers)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Subcategory / Protein</label>
                  <input
                    type="text"
                    placeholder="e.g. Pork, Chicken, Seafood, Soup, Dessert"
                    value={foodForm.subcategory}
                    onChange={(e) => setFoodForm({ ...foodForm, subcategory: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Base / Platter Price (₱) *</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={foodForm.price}
                    onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Chafer Price (₱) (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="Leave blank if not applicable"
                    value={foodForm.chafer_price}
                    onChange={(e) => setFoodForm({ ...foodForm, chafer_price: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Description</label>
                <textarea
                  rows="2"
                  placeholder="Ingredients, preparation style, or serving notes..."
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="food-available-toggle"
                  checked={foodForm.is_available}
                  onChange={(e) => setFoodForm({ ...foodForm, is_available: e.target.checked })}
                  className="rounded border-[#1E2A45] bg-[#0B1220] text-cyan-400 focus:ring-cyan-400/50 h-4 w-4"
                />
                <label htmlFor="food-available-toggle" className="text-sm text-white select-none">
                  Available for booking / orders
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#1E2A45]">
                <button
                  type="button"
                  onClick={() => setShowFoodModal(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded-lg hover:bg-cyan-400/30 transition-colors font-medium shadow-sm"
                >
                  {editingFood ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: BATCH PRICE ADJUSTMENT MODAL                    */}
      {/* ======================================================== */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#1E2A45] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">⚡ Batch Price Adjust</h3>
                <p className="text-xs text-slate-400 mt-0.5">Apply uniform pricing across an entire category.</p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleBatchUpdateSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Select Category to Adjust</label>
                <select
                  value={batchCategory}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setBatchCategory(cat);
                    if (cat === 'mains') {
                      setBatchBasePrice(1300);
                      setBatchChaferPrice(1500);
                    } else if (cat === 'sides') {
                      setBatchBasePrice(500);
                      setBatchChaferPrice(600);
                    } else if (cat === 'drinks') {
                      setBatchBasePrice(200);
                      setBatchChaferPrice('');
                    } else if (cat === 'fruits') {
                      setBatchBasePrice(300);
                      setBatchChaferPrice('');
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-sm"
                >
                  <option value="mains">All Main Dishes (34 platters)</option>
                  <option value="sides">All Sides &amp; Desserts (17 platters)</option>
                  <option value="drinks">All Drinks (Jars)</option>
                  <option value="fruits">All Fruit Platters</option>
                  <option value="appetizers">All Appetizers</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">New Standard Base Price (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={batchBasePrice}
                  onChange={(e) => setBatchBasePrice(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-sm"
                />
              </div>

              {['mains', 'sides'].includes(batchCategory) && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">New Chafer Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={batchChaferPrice}
                    onChange={(e) => setBatchChaferPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-sm"
                  />
                </div>
              )}

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200">
                ⚠️ This will update all items in <strong>{batchCategory}</strong> to ₱{Number(batchBasePrice || 0).toLocaleString()}.
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#1E2A45]">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchBusy}
                  className="px-5 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium shadow-sm disabled:opacity-50"
                >
                  {batchBusy ? 'Updating...' : 'Apply to Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CATERING PACKAGES MODAL                         */}
      {/* ======================================================== */}
      {showPkgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#1E2A45] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                {editingPackage ? 'Edit Package' : 'Add Package'}
              </h3>
              <button onClick={() => setShowPkgModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitPkg} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Name</label>
                  <input
                    type="text"
                    required
                    value={pkgFormData.name}
                    onChange={(e) => setPkgFormData({ ...pkgFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Price per Guest (₱)</label>
                  <input
                    type="number"
                    required
                    value={pkgFormData.price_per_guest}
                    onChange={(e) => setPkgFormData({ ...pkgFormData, price_per_guest: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Min Guests</label>
                  <input
                    type="number"
                    required
                    value={pkgFormData.min_guests}
                    onChange={(e) => setPkgFormData({ ...pkgFormData, min_guests: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Max Guests</label>
                  <input
                    type="number"
                    required
                    value={pkgFormData.max_guests}
                    onChange={(e) => setPkgFormData({ ...pkgFormData, max_guests: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Description</label>
                <textarea
                  value={pkgFormData.description}
                  onChange={(e) => setPkgFormData({ ...pkgFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50 min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Event Types (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Wedding, Birthday, Corporate"
                  value={pkgFormData.event_types}
                  onChange={(e) => setPkgFormData({ ...pkgFormData, event_types: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Features (one per line)</label>
                <textarea
                  value={pkgFormData.features}
                  onChange={(e) => setPkgFormData({ ...pkgFormData, features: e.target.value })}
                  placeholder="Choice of 2 main dishes&#10;1 dessert option"
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50 min-h-[100px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-pkg"
                  checked={pkgFormData.featured}
                  onChange={(e) => setPkgFormData({ ...pkgFormData, featured: e.target.checked })}
                  className="rounded border-[#1E2A45] bg-[#0B1220] text-cyan-400 focus:ring-cyan-400/50"
                />
                <label htmlFor="featured-pkg" className="text-sm text-white">Featured Package</label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#1E2A45]">
                <button
                  type="button"
                  onClick={() => setShowPkgModal(false)}
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

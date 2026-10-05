import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';
import { PLATTER_MENU } from '../data/landingData';
import { setGlobalFoodPrices } from '../utils/paymentHelpers';

const authHeader = () => {
  const token = sessionStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// Global in-memory cache and subscriber listeners for real-time reactivity across pages
let cachedFoods = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds
const listeners = new Set();

const notifyListeners = () => {
  if (cachedFoods) {
    setGlobalFoodPrices(cachedFoods);
  }
  listeners.forEach((listener) => {
    try {
      listener(cachedFoods);
    } catch (e) {
      console.warn('Food listener notification error:', e);
    }
  });
};

/**
 * Fetch all food items from the server API, falling back to local static catalog if server is unreachable.
 */
export async function getFoods({ forceRefresh = false, category } = {}) {
  const now = Date.now();
  if (!forceRefresh && cachedFoods && (now - lastFetchTime < CACHE_TTL) && !category) {
    return cachedFoods;
  }

  try {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await axios.get(`/api/foods${params}`);
    if (res.data?.success && Array.isArray(res.data.foods)) {
      if (!category) {
        cachedFoods = res.data.foods;
        lastFetchTime = now;
        notifyListeners();
      }
      return res.data.foods;
    }
  } catch (err) {
    console.warn('Could not fetch foods from API, falling back to static catalog:', err.message);
  }

  // Fallback: build food list from static PLATTER_MENU
  if (!cachedFoods) {
    const fallbackList = [];
    (PLATTER_MENU.mains || []).forEach((m) => fallbackList.push({ ...m, category: 'mains', subcategory: m.sub, chafer_price: m.chaferPrice, is_available: true }));
    (PLATTER_MENU.specials || []).forEach((s) => fallbackList.push({ ...s, category: 'specials', subcategory: 'Specialty', is_available: true }));
    (PLATTER_MENU.sides || []).forEach((s) => fallbackList.push({ ...s, category: 'sides', subcategory: mSub(s), chafer_price: s.chaferPrice, is_available: true }));
    (PLATTER_MENU.drinks || []).forEach((d) => fallbackList.push({ ...d, category: 'drinks', subcategory: 'Beverage', is_available: true }));
    (PLATTER_MENU.fruits || []).forEach((f) => fallbackList.push({ ...f, category: 'fruits', subcategory: 'Fruits', is_available: true }));
    cachedFoods = fallbackList;
  }
  return cachedFoods;
}

function mSub(item) {
  return item.sub || 'Other';
}

/**
 * Update single food item price (Admin only)
 */
export async function updateFoodPrice(id, { price, chafer_price }) {
  const res = await axios.patch(
    `/api/foods/${id}/price`,
    { price: Number(price), chafer_price: chafer_price != null ? Number(chafer_price) : null },
    authHeader()
  );
  if (res.data?.success) {
    // Update local cache immediately
    if (cachedFoods) {
      cachedFoods = cachedFoods.map((f) =>
        f.id === id || String(f.id) === String(id)
          ? { ...f, price: Number(price), chafer_price: chafer_price != null ? Number(chafer_price) : null }
          : f
      );
      notifyListeners();
    }
  }
  return res.data;
}

/**
 * Update complete food item details (Admin only)
 */
export async function updateFood(id, foodData) {
  const res = await axios.put(`/api/foods/${id}`, foodData, authHeader());
  if (res.data?.success && res.data.food) {
    if (cachedFoods) {
      cachedFoods = cachedFoods.map((f) => (f.id === id || String(f.id) === String(id) ? res.data.food : f));
      notifyListeners();
    }
  }
  return res.data;
}

/**
 * Create new food item (Admin only)
 */
export async function createFood(foodData) {
  const res = await axios.post('/api/foods', foodData, authHeader());
  if (res.data?.success && res.data.food) {
    if (cachedFoods) {
      cachedFoods = [...cachedFoods, res.data.food];
      notifyListeners();
    }
  }
  return res.data;
}

/**
 * Toggle food item availability (Admin only)
 */
export async function toggleFoodAvailability(id, isAvailable) {
  const res = await axios.patch(`/api/foods/${id}/availability`, { is_available: isAvailable }, authHeader());
  if (res.data?.success) {
    if (cachedFoods) {
      cachedFoods = cachedFoods.map((f) =>
        f.id === id || String(f.id) === String(id) ? { ...f, is_available: isAvailable } : f
      );
      notifyListeners();
    }
  }
  return res.data;
}

/**
 * Batch update prices by category or items list (Admin only)
 */
export async function batchUpdatePrices(payload) {
  const res = await axios.post('/api/foods/batch-prices', payload, authHeader());
  if (res.data?.success) {
    // Invalidate and refresh cache
    await getFoods({ forceRefresh: true });
  }
  return res.data;
}

/**
 * Delete a food item (Admin only)
 */
export async function deleteFood(id) {
  const res = await axios.delete(`/api/foods/${id}`, authHeader());
  if (res.data?.success) {
    if (cachedFoods) {
      cachedFoods = cachedFoods.filter((f) => f.id !== id && String(f.id) !== String(id));
      notifyListeners();
    }
  }
  return res.data;
}

/**
 * React hook to access live food items and real-time prices across any component
 */
export function useFoods() {
  const [foods, setFoods] = useState(cachedFoods || []);
  const [loading, setLoading] = useState(!cachedFoods);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFoods({ forceRefresh: true });
      setFoods(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load foods');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleUpdate = (updatedList) => {
      if (mounted && updatedList) {
        setFoods(updatedList);
      }
    };

    listeners.add(handleUpdate);

    if (!cachedFoods) {
      getFoods()
        .then((data) => {
          if (mounted) setFoods(data || []);
        })
        .catch((err) => {
          if (mounted) setError(err.message);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
      listeners.delete(handleUpdate);
    };
  }, []);

  // Quick lookup helper: find price by food name or id
  const getDishPrice = useCallback(
    (nameOrId, defaultPrice = 0) => {
      if (!nameOrId) return defaultPrice;
      const normalized = String(nameOrId).trim().toLowerCase();
      const found = foods.find(
        (f) =>
          f.id === nameOrId ||
          (f.image_id && f.image_id.toLowerCase() === normalized) ||
          f.name.toLowerCase() === normalized
      );
      return found ? found.price : defaultPrice;
    },
    [foods]
  );

  // Quick lookup helper: find chafer price by food name or id
  const getDishChaferPrice = useCallback(
    (nameOrId, defaultChaferPrice = null) => {
      if (!nameOrId) return defaultChaferPrice;
      const normalized = String(nameOrId).trim().toLowerCase();
      const found = foods.find(
        (f) =>
          f.id === nameOrId ||
          (f.image_id && f.image_id.toLowerCase() === normalized) ||
          f.name.toLowerCase() === normalized
      );
      return found?.chafer_price != null ? found.chafer_price : defaultChaferPrice;
    },
    [foods]
  );

  return {
    foods,
    loading,
    error,
    refresh,
    getDishPrice,
    getDishChaferPrice,
  };
}

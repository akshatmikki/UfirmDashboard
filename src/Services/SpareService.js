const API = "https://api.urest.in:8096/api/Spare";

const SpareService = {
  getByProperty: async (propertyId) => {
    const res = await fetch(`${API}/GetByProperty?propertyId=${propertyId}`);
    return res.json();
  },

  create: async (formData) => {
    const res = await fetch(`${API}/Create`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  update: async (formData) => {
    const res = await fetch(`${API}/Update`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  delete: async (spareId) => {
    const res = await fetch(`${API}/Delete?spareId=${spareId}`, {
      method: "DELETE",
    });
    return res.json();
  },
};

export default SpareService;

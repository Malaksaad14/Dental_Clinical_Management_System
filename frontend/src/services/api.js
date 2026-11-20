const BASE_URL = '/api/v1';

export const api = {
  // Dental Chart
  async getPatientChart(patientId) {
    const res = await fetch(`${BASE_URL}/dental/patients/${patientId}/chart`);
    if (!res.ok) throw new Error('Failed to fetch dental chart');
    return res.json();
  },

  async addToothRecord(recordData) {
    const res = await fetch(`${BASE_URL}/dental/tooth-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData),
    });
    if (!res.ok) throw new Error('Failed to record tooth condition');
    return res.json();
  },

  async deleteToothRecord(recordId) {
    const res = await fetch(`${BASE_URL}/dental/tooth-records/${recordId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete tooth record');
    return true;
  },

  // Treatment Plans
  async getTreatmentPlans(patientId) {
    const res = await fetch(`${BASE_URL}/treatment-plans/patients/${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch treatment plans');
    return res.json();
  },

  async createTreatmentPlan(planData) {
    const res = await fetch(`${BASE_URL}/treatment-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData),
    });
    if (!res.ok) throw new Error('Failed to create treatment plan');
    return res.json();
  },

  async updatePlanItem(itemId, updateData) {
    const res = await fetch(`${BASE_URL}/treatment-plans/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error('Failed to update plan procedure');
    return res.json();
  },

  // Prescriptions
  async getPrescriptions(patientId) {
    const res = await fetch(`${BASE_URL}/prescriptions/patients/${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch prescriptions');
    return res.json();
  },

  async createPrescription(rxData) {
    const res = await fetch(`${BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rxData),
    });
    if (!res.ok) throw new Error('Failed to create prescription');
    return res.json();
  }
};

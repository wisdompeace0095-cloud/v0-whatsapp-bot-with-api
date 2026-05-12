import axios from 'axios';

const MOZOSUBZ_BASE_URL = process.env.MOZOSUBZ_API_BASE || 'https://api.mozosubz.xyz';
const API_TIMEOUT = parseInt(process.env.MOZOSUBZ_API_TIMEOUT) || 30000;

const apiClient = axios.create({
  baseURL: MOZOSUBZ_BASE_URL,
  timeout: API_TIMEOUT,
});

/**
 * Authenticate user with WhatsApp number
 */
export async function authenticateUser(whatsappPhone) {
  try {
    console.log('[API] Authenticating user:', whatsappPhone);
    
    const response = await apiClient.post('/api/whatsapp/authenticate', {
      whatsapp_phone: whatsappPhone
    });

    if (response.data.success) {
      console.log('[API] User authenticated:', response.data.user_id);
      return response.data;
    } else {
      throw new Error(response.data.message || 'Authentication failed');
    }
  } catch (error) {
    console.error('[API] Authentication error:', error.message);
    throw error;
  }
}

/**
 * Get data plans for a service
 */
export async function getDataPlans(serviceID) {
  try {
    console.log('[API] Fetching data plans for:', serviceID);
    
    const response = await apiClient.post('/api/whatsapp/data/plans', {
      serviceID: serviceID
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch plans');
    }
  } catch (error) {
    console.error('[API] Get data plans error:', error.message);
    throw error;
  }
}

/**
 * Purchase data
 */
export async function purchaseData(whatsappPhone, serviceID, phone, value, amount) {
  try {
    console.log('[API] Purchasing data:', { serviceID, phone, value, amount });
    
    const response = await apiClient.post('/api/whatsapp/data/purchase', {
      whatsappPhone: whatsappPhone,
      serviceID: serviceID,
      phone: phone,
      value: value,
      amount: amount
    });

    if (response.data.success) {
      console.log('[API] Data purchase successful:', response.data.transactionId);
      return response.data;
    } else {
      throw new Error(response.data.message || 'Purchase failed');
    }
  } catch (error) {
    console.error('[API] Purchase data error:', error.message);
    throw error;
  }
}

/**
 * Get cable plans
 */
export async function getCablePlans(provider) {
  try {
    console.log('[API] Fetching cable plans for:', provider);
    
    const response = await apiClient.post('/api/whatsapp/cable/plans', {
      provider: provider
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch plans');
    }
  } catch (error) {
    console.error('[API] Get cable plans error:', error.message);
    throw error;
  }
}

/**
 * Purchase cable subscription
 */
export async function purchaseCable(whatsappPhone, provider, plan, customerId, amount) {
  try {
    console.log('[API] Purchasing cable:', { provider, plan, customerId });
    
    const response = await apiClient.post('/api/whatsapp/cable/purchase', {
      whatsappPhone: whatsappPhone,
      provider: provider,
      plan: plan,
      customerId: customerId,
      amount: amount
    });

    if (response.data.success) {
      console.log('[API] Cable purchase successful:', response.data.transactionId);
      return response.data;
    } else {
      throw new Error(response.data.message || 'Purchase failed');
    }
  } catch (error) {
    console.error('[API] Purchase cable error:', error.message);
    throw error;
  }
}

/**
 * Get electricity DISCOs
 */
export async function getElectricityPlans() {
  try {
    console.log('[API] Fetching electricity DISCOs');
    
    const response = await apiClient.post('/api/whatsapp/electricity/plans', {});

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch DISCOs');
    }
  } catch (error) {
    console.error('[API] Get electricity plans error:', error.message);
    throw error;
  }
}

/**
 * Purchase electricity
 */
export async function purchaseElectricity(whatsappPhone, disco, customerId, amount) {
  try {
    console.log('[API] Purchasing electricity:', { disco, customerId, amount });
    
    const response = await apiClient.post('/api/whatsapp/electricity/purchase', {
      whatsappPhone: whatsappPhone,
      disco: disco,
      customerId: customerId,
      amount: amount
    });

    if (response.data.success) {
      console.log('[API] Electricity purchase successful:', response.data.transactionId);
      return response.data;
    } else {
      throw new Error(response.data.message || 'Purchase failed');
    }
  } catch (error) {
    console.error('[API] Purchase electricity error:', error.message);
    throw error;
  }
}

/**
 * Check wallet balance
 */
export async function checkBalance(whatsappPhone) {
  try {
    console.log('[API] Checking balance for:', whatsappPhone);
    
    const response = await apiClient.post('/api/whatsapp/balance', {
      whatsappPhone: whatsappPhone
    });

    if (response.data.success) {
      console.log('[API] Balance retrieved:', response.data.formatted);
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch balance');
    }
  } catch (error) {
    console.error('[API] Check balance error:', error.message);
    throw error;
  }
}

/**
 * Initiate deposit
 */
export async function initiateDeposit(whatsappPhone, amount, description) {
  try {
    console.log('[API] Initiating deposit:', { amount, description });
    
    const response = await apiClient.post('/api/whatsapp/deposit/initiate', {
      whatsappPhone: whatsappPhone,
      amount: amount.toString(),
      description: description
    });

    if (response.data.success) {
      console.log('[API] Deposit initiated');
      return response.data;
    } else {
      throw new Error(response.data.message || 'Deposit initiation failed');
    }
  } catch (error) {
    console.error('[API] Initiate deposit error:', error.message);
    throw error;
  }
}

export default {
  authenticateUser,
  getDataPlans,
  purchaseData,
  getCablePlans,
  purchaseCable,
  getElectricityPlans,
  purchaseElectricity,
  checkBalance,
  initiateDeposit
};

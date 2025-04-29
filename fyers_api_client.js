// =========================================================
// FYERS API CLIENT - NODE.JS/JAVASCRIPT
// =========================================================

const axios = require('axios');
const crypto = require('crypto');
const WebSocket = require('ws');

/**
 * Fyers API Documentation Reference:
 * https://api-docs.fyers.in/
 * 
 * PRODUCT TYPES:
 * - "INTRADAY": Intraday positions (automatically squared off at end of day)
 * - "CNC": Cash and Carry (delivery-based equity trading)
 * - "MARGIN": Margin Trading
 * - "CO": Cover Order - High leverage order with compulsory stop-loss
 * - "BO": Bracket Order - With target and stop loss
 * 
 * ORDER TYPES:
 * - "MARKET": Execute at best available market price, no price required
 * - "LIMIT": Execute only at specified price or better
 * - "SL": Stop Loss - Triggers at stop price, then places a limit order
 * - "SL-M": Stop Loss Market - Triggers at stop price, then places a market order
 * 
 * TRANSACTION TYPES:
 * - "1": To buy/purchase securities
 * - "2": To sell securities
 * 
 * VALIDITY TYPES:
 * - "DAY": Valid for the current trading day until market close
 * - "IOC": Immediate or Cancel - Executes immediately (fully/partially) or gets cancelled
 * - "GTD": Good Till Date - Valid for a specified number of days
 */

// Constants
const FYERS_API_URL = 'https://api.fyers.in/api/v2';
const FYERS_DATA_API_URL = 'https://api.fyers.in/data-rest/v2';

// Initialize the Fyers client
function initializeFyersClient(accessToken) {
    return {
        axiosInstance: axios.create({
            baseURL: FYERS_API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        }),
        dataAxiosInstance: axios.create({
            baseURL: FYERS_DATA_API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        }),
        accessToken
    };
}

// =========================================================
// 📦 AUTHENTICATION
// =========================================================

/**
 * Generate auth code to get access token
 * 
 * @param {string} clientId - The Fyers APP ID
 * @param {string} appType - Type of app (usually "100" for API)
 * @param {string} redirectUri - Callback URL after authentication
 * @returns {string} - The URL to redirect user for authentication
 */
function generateAuthCodeURL(clientId, appType, redirectUri) {
    // Generate a random state to prevent CSRF attacks
    const state = crypto.randomBytes(16).toString('hex');
    
    const authParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        state: state,
        app_id: `${clientId}-${appType}`
    });
    
    return `https://api.fyers.in/api/v2/generate-authcode?${authParams.toString()}`;
}

/**
 * Exchange auth code for access token
 * 
 * @param {string} authCode - Authorization code received from redirect
 * @param {string} clientId - The Fyers APP ID
 * @param {string} secretKey - The Fyers Secret Key
 * @param {string} redirectUri - The same redirect URI used in auth request
 * @returns {Promise} - Token generation response
 */
async function generateAccessToken(authCode, clientId, secretKey, redirectUri) {
    try {
        // Generate the hash required by Fyers
        const appIdHash = crypto.createHash('sha256')
            .update(`${authCode}:${secretKey}`)
            .digest('hex');
            
        const requestData = {
            grant_type: 'authorization_code',
            appIdHash: appIdHash,
            code: authCode,
            client_id: clientId,
            redirect_uri: redirectUri
        };
        
        console.log('Sending token request with data:', JSON.stringify({
            ...requestData,
            appIdHash: '******' // Mask the hash for security
        }));
        
        const response = await axios.post(
            'https://api.fyers.in/api/v2/validate-authcode',
            requestData,
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
        if (response.data && response.data.access_token) {
            console.log('Access token generated successfully');
            return response.data;
        } else {
            console.error('Token response did not contain access_token:', response.data);
            throw new Error('Invalid token response from Fyers');
        }
    } catch (error) {
        console.error('Error generating access token:', error.response ? error.response.data : error);
        throw error;
    }
}

// =========================================================
// 📦 USER PROFILE AND ACCOUNT
// =========================================================

/**
 * Get user profile details
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - User profile response
 */
async function getUserProfile(accessToken) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/profile');
        console.log('User profile fetched successfully');
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get user funds and margins
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Fund details response
 */
async function getFundDetails(accessToken) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/funds');
        console.log('Fund details fetched successfully');
        return response.data;
    } catch (error) {
        console.error('Error fetching fund details:', error.response ? error.response.data : error);
        throw error;
    }
}

// =========================================================
// 📦 ORDER MANAGEMENT
// =========================================================

/**
 * Place a market order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} symbol - Symbol of the instrument
 * @param {number} quantity - Number of shares/units to trade
 * @param {string} transactionType - "1" for BUY or "2" for SELL
 * @param {string} productType - Product type: "INTRADAY", "CNC", etc.
 * @returns {Promise} - Order placement response
 */
async function placeMarketOrder(accessToken, symbol, quantity, transactionType, productType) {
    const client = initializeFyersClient(accessToken);

    // Map product type to Fyers values
    const productTypeMap = {
        'INTRADAY': 'INTRADAY',
        'DELIVERY': 'CNC',
        'CNC': 'CNC',
        'MARGIN': 'MARGIN',
        'CO': 'CO',
        'BO': 'BO'
    };
    
    const orderData = {
        symbol: symbol,
        qty: quantity,
        type: 2, // 2 = Market, 1 = Limit
        side: transactionType, // 1 = Buy, 2 = Sell
        productType: productTypeMap[productType] || productType,
        validity: 'DAY',
        discloseQty: 0,
        limitPrice: 0,
        stopPrice: 0,
        offlineOrder: false
    };

    try {
        const response = await client.axiosInstance.post('/orders', orderData);
        console.log('Market order placed successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error placing market order:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Place a limit order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} symbol - Symbol of the instrument
 * @param {number} quantity - Number of shares/units to trade
 * @param {number} price - Specific price at which to execute the order
 * @param {string} transactionType - "1" for BUY or "2" for SELL
 * @param {string} productType - Product type: "INTRADAY", "CNC", etc.
 * @returns {Promise} - Order placement response
 */
async function placeLimitOrder(accessToken, symbol, quantity, price, transactionType, productType) {
    const client = initializeFyersClient(accessToken);
    
    // Map product type to Fyers values
    const productTypeMap = {
        'INTRADAY': 'INTRADAY',
        'DELIVERY': 'CNC',
        'CNC': 'CNC',
        'MARGIN': 'MARGIN',
        'CO': 'CO',
        'BO': 'BO'
    };
    
    const orderData = {
        symbol: symbol,
        qty: quantity,
        type: 1, // 1 = Limit
        side: transactionType, // 1 = Buy, 2 = Sell
        productType: productTypeMap[productType] || productType,
        validity: 'DAY',
        discloseQty: 0,
        limitPrice: price,
        stopPrice: 0,
        offlineOrder: false
    };

    try {
        const response = await client.axiosInstance.post('/orders', orderData);
        console.log('Limit order placed successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error placing limit order:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Place a stop-loss market order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} symbol - Symbol of the instrument
 * @param {number} quantity - Number of shares/units to trade
 * @param {number} triggerPrice - Price at which the stop-loss gets triggered
 * @param {string} transactionType - "1" for BUY or "2" for SELL
 * @param {string} productType - Product type: "INTRADAY", "CNC", etc.
 * @returns {Promise} - Order placement response
 */
async function placeStopLossMarketOrder(accessToken, symbol, quantity, triggerPrice, transactionType, productType) {
    const client = initializeFyersClient(accessToken);
    
    // Map product type to Fyers values
    const productTypeMap = {
        'INTRADAY': 'INTRADAY',
        'DELIVERY': 'CNC',
        'CNC': 'CNC',
        'MARGIN': 'MARGIN',
        'CO': 'CO',
        'BO': 'BO'
    };
    
    const orderData = {
        symbol: symbol,
        qty: quantity,
        type: 4, // 4 = SL-M (Stop Loss Market)
        side: transactionType, // 1 = Buy, 2 = Sell
        productType: productTypeMap[productType] || productType,
        validity: 'DAY',
        discloseQty: 0,
        limitPrice: 0,
        stopPrice: triggerPrice,
        offlineOrder: false
    };

    try {
        const response = await client.axiosInstance.post('/orders', orderData);
        console.log('Stop-loss market order placed successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error placing stop-loss market order:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Place a stop-loss limit order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} symbol - Symbol of the instrument
 * @param {number} quantity - Number of shares/units to trade
 * @param {number} price - Limit price for the order
 * @param {number} triggerPrice - Price at which the stop-loss gets triggered
 * @param {string} transactionType - "1" for BUY or "2" for SELL
 * @param {string} productType - Product type: "INTRADAY", "CNC", etc.
 * @returns {Promise} - Order placement response
 */
async function placeStopLossLimitOrder(accessToken, symbol, quantity, price, triggerPrice, transactionType, productType) {
    const client = initializeFyersClient(accessToken);
    
    // Map product type to Fyers values
    const productTypeMap = {
        'INTRADAY': 'INTRADAY',
        'DELIVERY': 'CNC',
        'CNC': 'CNC',
        'MARGIN': 'MARGIN',
        'CO': 'CO',
        'BO': 'BO'
    };
    
    const orderData = {
        symbol: symbol,
        qty: quantity,
        type: 3, // 3 = SL (Stop Loss Limit)
        side: transactionType, // 1 = Buy, 2 = Sell
        productType: productTypeMap[productType] || productType,
        validity: 'DAY',
        discloseQty: 0,
        limitPrice: price,
        stopPrice: triggerPrice,
        offlineOrder: false
    };

    try {
        const response = await client.axiosInstance.post('/orders', orderData);
        console.log('Stop-loss limit order placed successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error placing stop-loss limit order:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Modify an existing order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} orderId - ID of the order to modify
 * @param {number} quantity - New quantity (optional)
 * @param {number} price - New price for limit orders (optional)
 * @param {number} triggerPrice - New trigger price for stop orders (optional)
 * @returns {Promise} - Order modification response
 */
async function modifyOrder(accessToken, orderId, quantity = null, price = null, triggerPrice = null) {
    const client = initializeFyersClient(accessToken);
    
    const modifyData = {
        id: orderId
    };

    if (quantity !== null) modifyData.qty = quantity;
    if (price !== null) modifyData.limitPrice = price;
    if (triggerPrice !== null) modifyData.stopPrice = triggerPrice;

    try {
        const response = await client.axiosInstance.put('/orders', modifyData);
        console.log('Order modified successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error modifying order:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Cancel an existing order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} orderId - ID of the order to cancel
 * @returns {Promise} - Order cancellation response
 */
async function cancelOrder(accessToken, orderId) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.delete(`/orders/${orderId}`);
        console.log('Order cancelled successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error cancelling order:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get details of a specific order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} orderId - ID of the order
 * @returns {Promise} - Order details response
 */
async function getOrderDetails(accessToken, orderId) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get(`/orders?id=${orderId}`);
        console.log('Order details fetched successfully');
        return response.data;
    } catch (error) {
        console.error('Error fetching order details:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get order book (list of all orders)
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Order book response
 */
async function getOrderBook(accessToken) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/orders');
        console.log('Order book fetched successfully');
        return response.data;
    } catch (error) {
        console.error('Error fetching order book:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get trade book (list of executed trades)
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Trade book response
 */
async function getTradeBook(accessToken) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/trades');
        console.log('Trade book fetched successfully');
        return response.data;
    } catch (error) {
        console.error('Error fetching trade book:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get current positions
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Positions response
 */
async function getPositions(accessToken) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/positions');
        console.log('Positions fetched successfully');
        return response.data;
    } catch (error) {
        console.error('Error fetching positions:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get holdings (long-term investments)
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Holdings response
 */
async function getHoldings(accessToken) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/holdings');
        console.log('Holdings fetched successfully');
        return response.data;
    } catch (error) {
        console.error('Error fetching holdings:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get market quotes for instruments
 * 
 * @param {string} accessToken - Authentication token
 * @param {Array<string>} symbols - Array of symbols to get quotes for
 * @returns {Promise} - Market quotes response
 */
async function getMarketQuotes(accessToken, symbols) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/quotes', {
            params: {
                symbols: symbols.join(',')
            }
        });
        console.log('Market quotes fetched successfully');
        return response.data;
    } catch (error) {
        console.error('Error fetching market quotes:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get historical data for an instrument
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} symbol - Symbol of the instrument
 * @param {string} resolution - Timeframe: "1", "5", "15", "30", "60", "D", "W", "M"
 * @param {string|number} from - Start date in epoch timestamp
 * @param {string|number} to - End date in epoch timestamp
 * @returns {Promise} - Historical data response
 */
async function getHistoricalData(accessToken, symbol, resolution, from, to) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.dataAxiosInstance.get('/history', {
            params: {
                symbol,
                resolution,
                date_format: '1',
                range_from: from,
                range_to: to,
                cont_flag: '1'
            }
        });
        console.log('Historical data fetched successfully');
        return response.data;
    } catch (error) {
        console.error('Error fetching historical data:', error.response ? error.response.data : error);
        throw error;
    }
}

// Export all functions
module.exports = {
    generateAuthCodeURL,
    generateAccessToken,
    getUserProfile,
    getFundDetails,
    placeMarketOrder,
    placeLimitOrder,
    placeStopLossMarketOrder,
    placeStopLossLimitOrder,
    modifyOrder,
    cancelOrder,
    getOrderDetails,
    getOrderBook,
    getTradeBook,
    getPositions,
    getHoldings,
    getMarketQuotes,
    getHistoricalData
}; 
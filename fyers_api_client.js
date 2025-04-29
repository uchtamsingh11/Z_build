// =========================================================
// FYERS API CLIENT - NODE.JS/JAVASCRIPT (v3)
// =========================================================

const axios = require('axios');
const WebSocket = require('ws');

/**
 * Fyers API Documentation Reference:
 * https://myapi.fyers.in/docsv3
 * 
 * PRODUCT TYPES:
 * - "INTRADAY": Intraday positions (automatically squared off at end of day)
 * - "CNC": Cash and Carry (Delivery)
 * - "MARGIN": Margin Trading
 * - "CO": Cover Order - High leverage order with compulsory stop-loss
 * - "BO": Bracket Order - Has target and stop-loss
 * 
 * ORDER TYPES:
 * - "MARKET": Execute at best available market price, no price required
 * - "LIMIT": Execute only at specified price or better
 * - "SL": Stop Loss - Triggers at stop price, then places a limit order
 * - "SL-M": Stop Loss Market - Triggers at stop price, then places a market order
 * 
 * TRANSACTION TYPES:
 * - "BUY": To buy/purchase securities
 * - "SELL": To sell securities
 * 
 * VALIDITY TYPES:
 * - "DAY": Valid for the current trading day until market close
 * - "IOC": Immediate or Cancel - Executes immediately (fully/partially) or gets cancelled
 */

// Constants
const FYERS_API_URL = 'https://api-t1.fyers.in/api/v3';
const FYERS_AUTH_URL = 'https://api.fyers.in/api/v2/token';
const FYERS_GENERATE_AUTH_CODE_URL = 'https://api.fyers.in/api/v2/generate-authcode';

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
        accessToken
    };
}

// =========================================================
// 📦 AUTHENTICATION FLOWS
// =========================================================

/**
 * Get auth code URL for user login
 * 
 * @param {string} clientId - App ID
 * @param {string} redirectUri - Redirect URI
 * @param {string} state - Random state for CSRF protection
 * @returns {string} - Auth code URL
 */
function getAuthCodeUrl(clientId, redirectUri, state = 'sample_state') {
    return `https://api.fyers.in/api/v2/generate-authcode?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
}

/**
 * Exchange auth code for access token
 * 
 * @param {string} authCode - Auth code from redirect
 * @param {string} clientId - App ID 
 * @param {string} secretKey - Secret key
 * @param {string} redirectUri - Redirect URI
 * @returns {Promise} - Access token response
 */
async function getAccessToken(authCode, clientId, secretKey, redirectUri) {
    try {
        const response = await axios.post(FYERS_AUTH_URL, {
            grant_type: 'authorization_code',
            code: authCode,
            client_id: clientId,
            client_secret: secretKey,
            redirect_uri: redirectUri
        });
        
        console.log('Access token fetched successfully');
        return response.data;
    } catch (error) {
        console.error('Error fetching access token:', error.response ? error.response.data : error);
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
        console.log('User profile fetched successfully:', response.data);
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
        console.log('Fund details fetched successfully:', response.data);
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
 * @param {string} symbol - Symbol for the instrument
 * @param {number} quantity - Number of shares/units to trade
 * @param {string} transactionType - "BUY" or "SELL"
 * @param {string} productType - Product type: "INTRADAY", "CNC", etc.
 * @returns {Promise} - Order placement response
 */
async function placeMarketOrder(accessToken, symbol, quantity, transactionType, productType) {
    const client = initializeFyersClient(accessToken);
    
    const orderData = {
        symbol: symbol,
        qty: quantity,
        type: productType,
        side: transactionType,
        order_type: "MARKET",
        validity: "DAY",
        disc_qty: 0,
        offline_order: false
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
 * @param {string} symbol - Symbol for the instrument
 * @param {number} quantity - Number of shares/units to trade
 * @param {number} price - Specific price at which to execute the order
 * @param {string} transactionType - "BUY" or "SELL"
 * @param {string} productType - Product type: "INTRADAY", "CNC", etc.
 * @returns {Promise} - Order placement response
 */
async function placeLimitOrder(accessToken, symbol, quantity, price, transactionType, productType) {
    const client = initializeFyersClient(accessToken);
    
    const orderData = {
        symbol: symbol,
        qty: quantity,
        price: price,
        type: productType,
        side: transactionType,
        order_type: "LIMIT",
        validity: "DAY",
        disc_qty: 0,
        offline_order: false
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
 * @param {string} symbol - Symbol for the instrument
 * @param {number} quantity - Number of shares/units to trade
 * @param {number} triggerPrice - Price at which the stop-loss gets triggered
 * @param {string} transactionType - "BUY" or "SELL"
 * @param {string} productType - Product type: "INTRADAY", "CNC", etc.
 * @returns {Promise} - Order placement response
 */
async function placeStopLossMarketOrder(accessToken, symbol, quantity, triggerPrice, transactionType, productType) {
    const client = initializeFyersClient(accessToken);
    
    const orderData = {
        symbol: symbol,
        qty: quantity,
        type: productType,
        side: transactionType,
        order_type: "SL-M",
        validity: "DAY",
        disc_qty: 0,
        stop_price: triggerPrice,
        offline_order: false
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
 * Modify an existing order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} orderId - ID of the order to modify
 * @param {number} quantity - New quantity (optional)
 * @param {number} price - New price (optional)
 * @param {number} triggerPrice - New trigger price (optional)
 * @returns {Promise} - Order modification response
 */
async function modifyOrder(accessToken, orderId, quantity = null, price = null, triggerPrice = null) {
    const client = initializeFyersClient(accessToken);
    
    // Prepare update data object
    const updateData = {
        id: orderId
    };
    
    // Add optional parameters if provided
    if (quantity !== null) updateData.qty = quantity;
    if (price !== null) updateData.price = price;
    if (triggerPrice !== null) updateData.stop_price = triggerPrice;

    try {
        const response = await client.axiosInstance.put('/orders', updateData);
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
 * Get order details by ID
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} orderId - ID of the order
 * @returns {Promise} - Order details response
 */
async function getOrderDetails(accessToken, orderId) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get(`/orders/${orderId}`);
        console.log('Order details fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching order details:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get order book (all orders)
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Order book response
 */
async function getOrderBook(accessToken) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/orders');
        console.log('Order book fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching order book:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get trade book (executed trades)
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Trade book response
 */
async function getTradeBook(accessToken) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/trades');
        console.log('Trade book fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching trade book:', error.response ? error.response.data : error);
        throw error;
    }
}

// =========================================================
// 📦 POSITIONS AND HOLDINGS
// =========================================================

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
        console.log('Positions fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching positions:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get holdings
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Holdings response
 */
async function getHoldings(accessToken) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/holdings');
        console.log('Holdings fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching holdings:', error.response ? error.response.data : error);
        throw error;
    }
}

// =========================================================
// 📦 MARKET DATA
// =========================================================

/**
 * Get market quotes for instruments
 * 
 * @param {string} accessToken - Authentication token
 * @param {Array} symbols - Array of symbols to get quotes for
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
        console.log('Market quotes fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching market quotes:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get historical data
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} symbol - Symbol for which to get historical data
 * @param {string} resolution - Timeframe resolution ('1', '5', '15', '30', 'D', 'W', 'M')
 * @param {string} from - From date-time in epoch format
 * @param {string} to - To date-time in epoch format
 * @returns {Promise} - Historical data response
 */
async function getHistoricalData(accessToken, symbol, resolution, from, to) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/historical-data', {
            params: {
                symbol: symbol,
                resolution: resolution,
                from: from,
                to: to
            }
        });
        console.log('Historical data fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching historical data:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get list of available instruments
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Instruments response
 */
async function getInstruments(accessToken) {
    const client = initializeFyersClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/instruments');
        console.log('Instruments fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching instruments:', error.response ? error.response.data : error);
        throw error;
    }
}

// Export functions
module.exports = {
    // Authentication
    getAuthCodeUrl,
    getAccessToken,
    
    // User and Account
    getUserProfile,
    getFundDetails,
    
    // Order Management
    placeMarketOrder,
    placeLimitOrder,
    placeStopLossMarketOrder,
    modifyOrder,
    cancelOrder,
    getOrderDetails,
    getOrderBook,
    getTradeBook,
    
    // Positions and Holdings
    getPositions,
    getHoldings,
    
    // Market Data
    getMarketQuotes,
    getHistoricalData,
    getInstruments
}; 
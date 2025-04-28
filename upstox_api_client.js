// =========================================================
// UPSTOX API CLIENT - NODE.JS/JAVASCRIPT
// =========================================================

const axios = require('axios');
const WebSocket = require('ws');

/**
 * Upstox API Documentation Reference:
 * https://upstox.com/developer/api-documentation/open-api/
 * 
 * PRODUCT TYPES:
 * - "INTRADAY": Intraday positions (automatically squared off at end of day)
 * - "DELIVERY": For delivery-based equity trading and investments
 * - "CNC": Cash and Carry (equivalent to DELIVERY)
 * - "CO": Cover Order - High leverage order with compulsory stop-loss
 * - "MTF": Margin Trading Facility
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
 * - "TTL": Time to Live - Valid for a specified number of days
 */

// Constants
const UPSTOX_API_URL = 'https://api.upstox.com/v2';

// Initialize the Upstox client
function initializeUpstoxClient(accessToken) {
    return {
        axiosInstance: axios.create({
            baseURL: UPSTOX_API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        }),
        accessToken
    };
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
    const client = initializeUpstoxClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/user/profile');
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
    const client = initializeUpstoxClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/user/get-funds-and-margin');
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
 * @param {string} instrumentKey - Key for the instrument
 * @param {number} quantity - Number of shares/units to trade
 * @param {string} transactionType - "BUY" or "SELL"
 * @param {string} productType - Product type: "INTRADAY", "DELIVERY", etc.
 * @returns {Promise} - Order placement response
 */
async function placeMarketOrder(accessToken, instrumentKey, quantity, transactionType, productType) {
    const client = initializeUpstoxClient(accessToken);
    
    const orderData = {
        instrument_key: instrumentKey,
        quantity: quantity,
        product: productType,
        transaction_type: transactionType,
        order_type: "MARKET",
        validity: "DAY",
        disclosed_quantity: 0,
        trigger_price: 0,
        is_amo: false
    };

    try {
        const response = await client.axiosInstance.post('/order/place', orderData);
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
 * @param {string} instrumentKey - Key for the instrument
 * @param {number} quantity - Number of shares/units to trade
 * @param {number} price - Specific price at which to execute the order
 * @param {string} transactionType - "BUY" or "SELL"
 * @param {string} productType - Product type: "INTRADAY", "DELIVERY", etc.
 * @returns {Promise} - Order placement response
 */
async function placeLimitOrder(accessToken, instrumentKey, quantity, price, transactionType, productType) {
    const client = initializeUpstoxClient(accessToken);
    
    const orderData = {
        instrument_key: instrumentKey,
        quantity: quantity,
        price: price,
        product: productType,
        transaction_type: transactionType,
        order_type: "LIMIT",
        validity: "DAY",
        disclosed_quantity: 0,
        trigger_price: 0,
        is_amo: false
    };

    try {
        const response = await client.axiosInstance.post('/order/place', orderData);
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
 * @param {string} instrumentKey - Key for the instrument
 * @param {number} quantity - Number of shares/units to trade
 * @param {number} triggerPrice - Price at which the stop-loss gets triggered
 * @param {string} transactionType - "BUY" or "SELL"
 * @param {string} productType - Product type: "INTRADAY", "DELIVERY", etc.
 * @returns {Promise} - Order placement response
 */
async function placeStopLossMarketOrder(accessToken, instrumentKey, quantity, triggerPrice, transactionType, productType) {
    const client = initializeUpstoxClient(accessToken);
    
    const orderData = {
        instrument_key: instrumentKey,
        quantity: quantity,
        product: productType,
        transaction_type: transactionType,
        order_type: "SL-M",
        validity: "DAY",
        disclosed_quantity: 0,
        trigger_price: triggerPrice,
        is_amo: false
    };

    try {
        const response = await client.axiosInstance.post('/order/place', orderData);
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
 * @param {string} instrumentKey - Key for the instrument
 * @param {number} quantity - Number of shares/units to trade
 * @param {number} price - Specific price at which to execute the order
 * @param {number} triggerPrice - Price at which the stop-loss gets triggered
 * @param {string} transactionType - "BUY" or "SELL"
 * @param {string} productType - Product type: "INTRADAY", "DELIVERY", etc.
 * @returns {Promise} - Order placement response
 */
async function placeStopLossLimitOrder(accessToken, instrumentKey, quantity, price, triggerPrice, transactionType, productType) {
    const client = initializeUpstoxClient(accessToken);
    
    const orderData = {
        instrument_key: instrumentKey,
        quantity: quantity,
        price: price,
        product: productType,
        transaction_type: transactionType,
        order_type: "SL",
        validity: "DAY",
        disclosed_quantity: 0,
        trigger_price: triggerPrice,
        is_amo: false
    };

    try {
        const response = await client.axiosInstance.post('/order/place', orderData);
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
 * @param {number} price - New price (optional)
 * @param {number} triggerPrice - New trigger price (optional)
 * @param {string} validity - New validity (optional)
 * @param {number} disclosedQuantity - New disclosed quantity (optional)
 * @returns {Promise} - Order modification response
 */
async function modifyOrder(accessToken, orderId, quantity = null, price = null, triggerPrice = null, validity = null, disclosedQuantity = null) {
    const client = initializeUpstoxClient(accessToken);
    
    const modifyData = {
        order_id: orderId
    };

    // Add optional parameters only if they are provided
    if (quantity !== null) modifyData.quantity = quantity;
    if (price !== null) modifyData.price = price;
    if (triggerPrice !== null) modifyData.trigger_price = triggerPrice;
    if (validity !== null) modifyData.validity = validity;
    if (disclosedQuantity !== null) modifyData.disclosed_quantity = disclosedQuantity;

    try {
        const response = await client.axiosInstance.put('/order/modify', modifyData);
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
    const client = initializeUpstoxClient(accessToken);
    
    try {
        const response = await client.axiosInstance.delete(`/order/cancel?order_id=${orderId}`);
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
 * @param {string} orderId - ID of the order to retrieve
 * @returns {Promise} - Order details response
 */
async function getOrderDetails(accessToken, orderId) {
    const client = initializeUpstoxClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get(`/order/${orderId}`);
        console.log('Order details fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching order details:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get the order book (list of all orders)
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Order book response
 */
async function getOrderBook(accessToken) {
    const client = initializeUpstoxClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/order/history');
        console.log('Order book fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching order book:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get the trade book (list of all trades)
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Trade book response
 */
async function getTradeBook(accessToken) {
    const client = initializeUpstoxClient(accessToken);
    
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
// 📦 PORTFOLIO MANAGEMENT
// =========================================================

/**
 * Get current positions
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Positions response
 */
async function getPositions(accessToken) {
    const client = initializeUpstoxClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/portfolio/positions');
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
    const client = initializeUpstoxClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/portfolio/holdings');
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
 * @param {string[]} instrumentKeys - Array of instrument keys
 * @returns {Promise} - Market quotes response
 */
async function getMarketQuotes(accessToken, instrumentKeys) {
    const client = initializeUpstoxClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get(`/market-quote/quotes?instrument_key=${instrumentKeys.join(',')}`);
        console.log('Market quotes fetched successfully:', response.data);
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
 * @param {string} instrumentKey - Instrument key
 * @param {string} interval - Time interval (e.g., "1d", "1h", "15m")
 * @param {string} from - Start date in "YYYY-MM-DD" format
 * @param {string} to - End date in "YYYY-MM-DD" format
 * @returns {Promise} - Historical data response
 */
async function getHistoricalData(accessToken, instrumentKey, interval, from, to) {
    const client = initializeUpstoxClient(accessToken);
    
    const params = new URLSearchParams({
        instrument_key: instrumentKey,
        interval,
        from_date: from,
        to_date: to
    }).toString();
    
    try {
        const response = await client.axiosInstance.get(`/historical-candle/${instrumentKey}/${interval}?${params}`);
        console.log('Historical data fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching historical data:', error.response ? error.response.data : error);
        throw error;
    }
}

/**
 * Get instruments/securities list
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Instruments list response
 */
async function getInstruments(accessToken) {
    const client = initializeUpstoxClient(accessToken);
    
    try {
        const response = await client.axiosInstance.get('/market/instruments/master');
        console.log('Instruments list fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching instruments list:', error.response ? error.response.data : error);
        throw error;
    }
}

// =========================================================
// 📦 WEBSOCKET DATA STREAMING
// =========================================================

/**
 * Connect to the Upstox WebSocket for market data streaming
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise<WebSocket>} - WebSocket connection
 */
async function connectToMarketDataWebSocket(accessToken) {
    try {
        // First get the WebSocket feed token
        const client = initializeUpstoxClient(accessToken);
        const response = await client.axiosInstance.get('/market-quote/ws-connect');
        
        if (!response.data || !response.data.data || !response.data.data.authorizedRedirectUri) {
            throw new Error('Failed to get WebSocket authorization URI');
        }
        
        const wsUrl = response.data.data.authorizedRedirectUri;
        
        // Connect to WebSocket
        const ws = new WebSocket(wsUrl);
        
        ws.on('open', function open() {
            console.log('WebSocket connection opened');
        });
        
        ws.on('message', function incoming(data) {
            try {
                const parsedData = JSON.parse(data);
                console.log('Received WebSocket data:', parsedData);
            } catch (e) {
                console.error('Error parsing WebSocket data:', e);
            }
        });
        
        ws.on('error', function error(err) {
            console.error('WebSocket error:', err);
        });
        
        ws.on('close', function close() {
            console.log('WebSocket connection closed');
        });
        
        return ws;
    } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        throw error;
    }
}

/**
 * Subscribe to market data for specified instruments
 * 
 * @param {WebSocket} ws - WebSocket connection
 * @param {string[]} instrumentKeys - Array of instrument keys to subscribe to
 * @param {string} mode - Subscription mode: "full", "quote", or "ltp"
 */
function subscribeToMarketData(ws, instrumentKeys, mode = "full") {
    if (ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open');
        return;
    }
    
    const subscriptionMessage = {
        guid: "some-guid",
        method: "sub",
        data: {
            mode: mode,
            instrumentKeys: instrumentKeys
        }
    };
    
    ws.send(JSON.stringify(subscriptionMessage));
    console.log(`Subscribed to ${instrumentKeys.length} instruments`);
}

/**
 * Unsubscribe from market data for specified instruments
 * 
 * @param {WebSocket} ws - WebSocket connection
 * @param {string[]} instrumentKeys - Array of instrument keys to unsubscribe from
 */
function unsubscribeFromMarketData(ws, instrumentKeys) {
    if (ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open');
        return;
    }
    
    const unsubscriptionMessage = {
        guid: "some-guid",
        method: "unsub",
        data: {
            instrumentKeys: instrumentKeys
        }
    };
    
    ws.send(JSON.stringify(unsubscriptionMessage));
    console.log(`Unsubscribed from ${instrumentKeys.length} instruments`);
}

module.exports = {
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
    getHistoricalData,
    getInstruments,
    connectToMarketDataWebSocket,
    subscribeToMarketData,
    unsubscribeFromMarketData
}; 
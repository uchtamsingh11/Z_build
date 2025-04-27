// =========================================================
// UPSTOX API COMPREHENSIVE CODE EXAMPLES - NODE.JS/JAVASCRIPT
// =========================================================

const UpstoxClient = require('upstox-js-sdk');
const WebSocket = require('ws');

/**
 * PARAMETER OPTIONS REFERENCE
 * 
 * PRODUCT TYPES:
 * - "I": Intraday (MIS - Margin Intraday Square-off) - Positions automatically squared off at end of day
 * - "D": Delivery (CNC - Cash and Carry) - For delivery-based equity trading and investments
 * - "CO": Cover Order - High leverage order with compulsory stop-loss
 * - "OCO": One Cancels Other/Bracket Order - Allows placing main order with both target and stop-loss
 * 
 * VALIDITY TYPES:
 * - "DAY": Valid for the current trading day until market close
 * - "IOC": Immediate or Cancel - Executes immediately (fully/partially) or gets cancelled
 * - "GTD": Good Till Date - Valid until a specific date
 * - "GTC": Good Till Cancelled - Valid until explicitly cancelled
 * 
 * ORDER TYPES:
 * - "MARKET": Execute at best available market price, no price required
 * - "LIMIT": Execute only at specified price or better
 * - "SL": Stop-Loss Limit - Triggers at stop price, then places a limit order
 * - "SL-M": Stop-Loss Market - Triggers at stop price, then places a market order
 * 
 * TRANSACTION TYPES:
 * - "BUY": To buy/purchase securities
 * - "SELL": To sell securities
 * 
 * PRICE:
 * - For MARKET orders: Use 0 or null (price is determined by market)
 * - For LIMIT orders: Specify the exact price at which you want to buy/sell
 * - For SL orders: The limit price at which order executes after trigger
 * - For SL-M orders: Use 0 (executes at market price after trigger)
 * 
 * TRIGGER PRICE:
 * - For MARKET/LIMIT orders: Use 0 (not applicable)
 * - For SL/SL-M orders: Price at which the stop-loss order is triggered
 * 
 * IS_AMO (After Market Order):
 * - true: Order placed after market hours, queued for next trading session
 * - false: Regular order during market hours
 * 
 * DISCLOSED QUANTITY:
 * - Quantity to display publicly on exchange (partial quantity disclosure)
 * - 0 means display full quantity
 */

// Initialize the Upstox client
function initializeUpstoxClient(accessToken) {
    const defaultClient = UpstoxClient.ApiClient.instance;
    const OAUTH2 = defaultClient.authentications['OAUTH2'];
    OAUTH2.accessToken = accessToken;
    return defaultClient;
}

// =========================================================
// 📦 ORDER MANAGEMENT
// =========================================================

/**
 * Place a market order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} instrumentToken - Instrument identifier (e.g., "NSE_EQ|INE528G01035")
 * @param {number} quantity - Number of shares/units to trade
 * @param {string} transactionType - "BUY" or "SELL"
 * @param {string} product - Product type: "I" (Intraday), "D" (Delivery)
 * @param {boolean} isAmo - Whether it's an after-market order (default: false)
 * @returns {Promise} - Order placement response
 */
function placeMarketOrder(accessToken, instrumentToken, quantity, transactionType, product, isAmo = false) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.OrderApi();
    const body = new UpstoxClient.PlaceOrderRequest(
        quantity,
        UpstoxClient.PlaceOrderRequest.ProductEnum[product], // "I" for Intraday, "D" for Delivery
        UpstoxClient.PlaceOrderRequest.ValidityEnum.DAY,  // Default validity: DAY
        0.0, // price (0 for market order - executes at best available price)
        instrumentToken,
        UpstoxClient.PlaceOrderRequest.OrderTypeEnum.MARKET,
        UpstoxClient.PlaceOrderRequest.TransactionTypeEnum[transactionType], // "BUY" or "SELL"
        0, // disclosed_quantity (0 means show full quantity)
        0.0, // trigger_price (not required for market orders)
        isAmo // is_amo (after market order)
    );
    const apiVersion = "2.0";

    return apiInstance.placeOrder(body, apiVersion)
        .then(data => {
            console.log('Market order placed successfully. Order data:', data);
            return data;
        })
        .catch(error => {
            console.error('Error placing market order:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Place a limit order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} instrumentToken - Instrument identifier (e.g., "NSE_EQ|INE528G01035") 
 * @param {number} quantity - Number of shares/units to trade
 * @param {number} price - Specific price at which to execute the order
 * @param {string} transactionType - "BUY" or "SELL"
 * @param {string} product - Product type: "I" (Intraday), "D" (Delivery)
 * @param {boolean} isAmo - Whether it's an after-market order (default: false)
 * @returns {Promise} - Order placement response
 */
function placeLimitOrder(accessToken, instrumentToken, quantity, price, transactionType, product, isAmo = false) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.OrderApi();
    const body = new UpstoxClient.PlaceOrderRequest(
        quantity,
        UpstoxClient.PlaceOrderRequest.ProductEnum[product], // "I" or "D"
        UpstoxClient.PlaceOrderRequest.ValidityEnum.DAY,  // Default validity: DAY
        price, // Specific price for limit order - order executes only at this price or better
        instrumentToken,
        UpstoxClient.PlaceOrderRequest.OrderTypeEnum.LIMIT,
        UpstoxClient.PlaceOrderRequest.TransactionTypeEnum[transactionType], // "BUY" or "SELL"
        0, // disclosed_quantity (0 means show full quantity)
        0.0, // trigger_price not needed for simple limit
        isAmo // is_amo (true for after-market orders, false for regular orders)
    );
    const apiVersion = "2.0";

    return apiInstance.placeOrder(body, apiVersion)
        .then(data => {
            console.log('Limit order placed successfully. Order data:', data);
            return data;
        })
        .catch(error => {
            console.error('Error placing limit order:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Place a stop-loss market order
 * Order triggers at specified trigger_price, then executes as a market order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} instrumentToken - Instrument identifier (e.g., "NSE_EQ|INE528G01035")
 * @param {number} quantity - Number of shares/units to trade
 * @param {number} triggerPrice - Price at which the stop-loss gets triggered
 * @param {string} transactionType - "BUY" or "SELL"
 * @param {string} product - Product type: "I" (Intraday), "D" (Delivery)
 * @param {boolean} isAmo - Whether it's an after-market order (default: false)
 * @returns {Promise} - Order placement response
 */
function placeStopLossMarketOrder(accessToken, instrumentToken, quantity, triggerPrice, transactionType, product, isAmo = false) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.OrderApi();
    const body = new UpstoxClient.PlaceOrderRequest(
        quantity,
        UpstoxClient.PlaceOrderRequest.ProductEnum[product], // "I" or "D"
        UpstoxClient.PlaceOrderRequest.ValidityEnum.DAY,  // Default validity: DAY
        0.0, // price (0 for market execution once triggered)
        instrumentToken,
        UpstoxClient.PlaceOrderRequest.OrderTypeEnum.SL_M,
        UpstoxClient.PlaceOrderRequest.TransactionTypeEnum[transactionType], // "BUY" or "SELL"
        0, // disclosed_quantity (0 means show full quantity)
        triggerPrice, // trigger_price - SL will trigger at this price
        isAmo // is_amo (true for after-market orders, false for regular orders)
    );
    const apiVersion = "2.0";

    return apiInstance.placeOrder(body, apiVersion)
        .then(data => {
            console.log('Stop-loss market order placed successfully. Order data:', data);
            return data;
        })
        .catch(error => {
            console.error('Error placing SL-M order:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Place a stop-loss limit order
 * Order triggers at triggerPrice, then places a limit order at specified price
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} instrumentToken - Instrument identifier (e.g., "NSE_EQ|INE528G01035")
 * @param {number} quantity - Number of shares/units to trade
 * @param {number} price - Limit price at which order executes after being triggered
 * @param {number} triggerPrice - Price at which the stop-loss gets triggered
 * @param {string} transactionType - "BUY" or "SELL"
 * @param {string} product - Product type: "I" (Intraday), "D" (Delivery)
 * @param {boolean} isAmo - Whether it's an after-market order (default: false)
 * @returns {Promise} - Order placement response
 */
function placeStopLossLimitOrder(accessToken, instrumentToken, quantity, price, triggerPrice, transactionType, product, isAmo = false) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.OrderApi();
    const body = new UpstoxClient.PlaceOrderRequest(
        quantity,
        UpstoxClient.PlaceOrderRequest.ProductEnum[product], // "I" or "D"
        UpstoxClient.PlaceOrderRequest.ValidityEnum.DAY,  // Default validity: DAY
        price, // limit price (will execute at this price or better after trigger)
        instrumentToken,
        UpstoxClient.PlaceOrderRequest.OrderTypeEnum.SL,
        UpstoxClient.PlaceOrderRequest.TransactionTypeEnum[transactionType], // "BUY" or "SELL"
        0, // disclosed_quantity (0 means show full quantity)
        triggerPrice, // trigger_price - order activates at this price
        isAmo // is_amo (true for after-market orders, false for regular orders)
    );
    const apiVersion = "2.0";

    return apiInstance.placeOrder(body, apiVersion)
        .then(data => {
            console.log('Stop-loss limit order placed successfully. Order data:', data);
            return data;
        })
        .catch(error => {
            console.error('Error placing SL order:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Modify an existing order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} orderId - The ID of the order to modify
 * @param {number|null} newQuantity - New quantity, null to keep unchanged
 * @param {number|null} newPrice - New price, null to keep unchanged
 * @param {number|null} newDisclosedQuantity - New disclosed quantity, null to keep unchanged
 * @param {number|null} newTriggerPrice - New trigger price (for SL/SL-M orders), null to keep unchanged
 * @returns {Promise} - Order modification response
 */
function modifyOrder(accessToken, orderId, newQuantity = null, newPrice = null, newDisclosedQuantity = null, newTriggerPrice = null) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.OrderApi();
    const body = new UpstoxClient.ModifyOrderRequest(
        orderId,
        newQuantity,
        newPrice,
        newDisclosedQuantity,
        newTriggerPrice,
        UpstoxClient.ModifyOrderRequest.ValidityEnum.DAY  // Default validity: DAY
    );
    const apiVersion = "2.0";

    return apiInstance.modifyOrder(body, apiVersion)
        .then(data => {
            console.log('Order modified successfully. Modified order data:', data);
            return data;
        })
        .catch(error => {
            console.error('Error modifying order:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Cancel an order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} orderId - The ID of the order to cancel
 * @returns {Promise} - Order cancellation response
 */
function cancelOrder(accessToken, orderId) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.OrderApi();
    const apiVersion = "2.0";

    return apiInstance.cancelOrder(orderId, apiVersion)
        .then(data => {
            console.log('Order cancelled successfully. Response:', data);
            return data;
        })
        .catch(error => {
            console.error('Error cancelling order:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Get details of a specific order
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} orderId - The ID of the order to retrieve
 * @returns {Promise} - Order details response
 */
function getOrderDetails(accessToken, orderId) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.OrderApi();
    const apiVersion = "2.0";

    return apiInstance.getOrderDetails(orderId, apiVersion)
        .then(data => {
            console.log('Order details retrieved successfully:', data);
            return data;
        })
        .catch(error => {
            console.error('Error retrieving order details:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Get all orders (order book)
 * Retrieves all orders placed for the day
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Order book response with array of orders
 */
function getOrderBook(accessToken) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.OrderApi();
    const apiVersion = "2.0";

    return apiInstance.getOrderBook(apiVersion)
        .then(data => {
            console.log('Order book retrieved successfully. Total orders:', data.orders.length);
            return data;
        })
        .catch(error => {
            console.error('Error retrieving order book:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Get trade history (trade book)
 * Retrieves all executed trades for the day
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Trade book response with array of trades
 */
function getTradeBook(accessToken) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.OrderApi();
    const apiVersion = "2.0";

    return apiInstance.getTradeBook(apiVersion)
        .then(data => {
            console.log('Trade book retrieved successfully. Total trades:', data.trades.length);
            return data;
        })
        .catch(error => {
            console.error('Error retrieving trade book:', error.response ? error.response.text : error);
            throw error;
        });
}

// =========================================================
// 👤 PROFILE & ACCOUNT DETAILS
// =========================================================

/**
 * Get user profile
 * Retrieves user information including client ID, name, email, etc.
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - User profile response
 */
function getUserProfile(accessToken) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.UserApi();
    const apiVersion = "2.0";

    return apiInstance.getProfile(apiVersion)
        .then(data => {
            console.log('User profile retrieved successfully:', data);
            return data;
        })
        .catch(error => {
            console.error('Error retrieving user profile:', error.response ? error.response.text : error);
            throw error;
        });
}

// =========================================================
// 💰 FUNDS & MARGINS
// =========================================================

/**
 * Get fund and margin details
 * Retrieves available and used margins across segments
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Fund details response with margins by segment
 */
function getFundDetails(accessToken) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.UserApi();
    const apiVersion = "2.0";

    return apiInstance.getFunds(apiVersion)
        .then(data => {
            console.log('Fund details retrieved successfully:');
            console.log('Available margin:', data.equity.available_margin);
            console.log('Used margin:', data.equity.used_margin);
            return data;
        })
        .catch(error => {
            console.error('Error retrieving fund details:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Get positions (open trades)
 * Retrieves all currently open intraday and carry-forward positions
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Positions response with array of open positions
 */
function getPositions(accessToken) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.PortfolioApi();
    const apiVersion = "2.0";

    return apiInstance.getPositions(apiVersion)
        .then(data => {
            console.log('Positions retrieved successfully. Total positions:', data.positions.length);
            return data;
        })
        .catch(error => {
            console.error('Error retrieving positions:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Get holdings (long-term investments)
 * Retrieves all stocks held in demat account
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Holdings response with array of stocks in demat
 */
function getHoldings(accessToken) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.PortfolioApi();
    const apiVersion = "2.0";

    return apiInstance.getHoldings(apiVersion)
        .then(data => {
            console.log('Holdings retrieved successfully. Total holdings:', data.holdings.length);
            return data;
        })
        .catch(error => {
            console.error('Error retrieving holdings:', error.response ? error.response.text : error);
            throw error;
        });
}

// =========================================================
// 📈 WEBSOCKET CONNECTIONS
// =========================================================

/**
 * Connect to market data websocket
 * Establishes a websocket connection for receiving real-time market data
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise<WebSocket>} - WebSocket connection object
 */
async function connectToMarketDataWebSocket(accessToken) {
    initializeUpstoxClient(accessToken);
    const marketDataApi = new UpstoxClient.MarketDataApi();
    const apiVersion = "2.0";
    
    try {
        // Get feed token for websocket authentication
        const feedTokenResponse = await marketDataApi.getMarketDataFeedAuthorize(apiVersion);
        const wsUrl = feedTokenResponse.data.authorized_redirect_uri;
        
        // Connect to WebSocket with the token
        const ws = new WebSocket(wsUrl);
        
        ws.on('open', function open() {
            console.log('Market data WebSocket connection established');
        });
        
        ws.on('message', function incoming(data) {
            const marketData = JSON.parse(data);
            console.log('Market data received:', marketData);
            // Process the data as needed
        });
        
        ws.on('error', function error(err) {
            console.error('WebSocket error:', err);
        });
        
        ws.on('close', function close() {
            console.log('WebSocket connection closed');
        });
        
        return ws;
    } catch (error) {
        console.error('Error setting up market data WebSocket:', error);
        throw error;
    }
}

/**
 * Subscribe to market data
 * Subscribes to real-time updates for specified instruments
 * 
 * @param {WebSocket} ws - WebSocket connection from connectToMarketDataWebSocket()
 * @param {string[]} instrumentKeys - Array of instrument tokens to subscribe to
 * @param {string} mode - Data mode: "full" (complete data), "quote" (quote data), "ltpc" (last traded price and quantity)
 */
function subscribeToMarketData(ws, instrumentKeys, mode = "full") {
    const subscribePayload = {
        guid: Date.now().toString(), // unique ID for this subscription
        method: "sub",
        data: {
            mode: mode,  // Can be "full", "quote", or "ltpc"
            instrumentKeys: instrumentKeys
        }
    };
    
    ws.send(JSON.stringify(subscribePayload));
    console.log(`Subscribed to ${instrumentKeys.length} instruments in ${mode} mode`);
}

/**
 * Unsubscribe from market data
 * Stops receiving updates for specified instruments
 * 
 * @param {WebSocket} ws - WebSocket connection from connectToMarketDataWebSocket()
 * @param {string[]} instrumentKeys - Array of instrument tokens to unsubscribe from
 */
function unsubscribeFromMarketData(ws, instrumentKeys) {
    const unsubscribePayload = {
        guid: Date.now().toString(),
        method: "unsub",
        data: {
            instrumentKeys: instrumentKeys
        }
    };
    
    ws.send(JSON.stringify(unsubscribePayload));
    console.log(`Unsubscribed from ${instrumentKeys.length} instruments`);
}

/**
 * Connect to order updates websocket
 * Establishes a websocket connection for receiving real-time order updates
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise<WebSocket>} - WebSocket connection object
 */
async function connectToOrderWebSocket(accessToken) {
    initializeUpstoxClient(accessToken);
    const orderApi = new UpstoxClient.OrderApi();
    const apiVersion = "2.0";
    
    try {
        // Get feed token for websocket authentication
        const feedTokenResponse = await orderApi.getOrderFeedAuthorize(apiVersion);
        const wsUrl = feedTokenResponse.data.authorized_redirect_uri;
        
        // Connect to WebSocket with the token
        const ws = new WebSocket(wsUrl);
        
        ws.on('open', function open() {
            console.log('Order WebSocket connection established');
        });
        
        ws.on('message', function incoming(data) {
            const orderUpdate = JSON.parse(data);
            console.log('Order update received:', orderUpdate);
            // Process the order update as needed
        });
        
        ws.on('error', function error(err) {
            console.error('Order WebSocket error:', err);
        });
        
        ws.on('close', function close() {
            console.log('Order WebSocket connection closed');
        });
        
        return ws;
    } catch (error) {
        console.error('Error setting up order WebSocket:', error);
        throw error;
    }
}

// =========================================================
// 🧩 MISCELLANEOUS APIs
// =========================================================

/**
 * Get market quotes
 * Retrieves full market quotes for specified instruments
 * 
 * @param {string} accessToken - Authentication token
 * @param {string[]} instrumentKeys - Array of instrument tokens to get quotes for
 * @returns {Promise} - Market quotes response
 */
function getMarketQuotes(accessToken, instrumentKeys) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.MarketDataApi();
    const apiVersion = "2.0";

    return apiInstance.getFullMarketQuote(instrumentKeys, apiVersion)
        .then(data => {
            console.log('Market quotes retrieved successfully');
            return data.data;
        })
        .catch(error => {
            console.error('Error retrieving market quotes:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Get historical data
 * Retrieves OHLC candle data for specified instrument and timeframe
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} instrumentKey - Instrument token to get historical data for
 * @param {string} interval - Candle interval: "1m", "5m", "15m", "30m", "1h", "1d", "1w", "1mo"
 * @param {Date} fromDate - Start date for historical data
 * @param {Date} toDate - End date for historical data
 * @returns {Promise} - Historical data response with candles
 */
function getHistoricalData(accessToken, instrumentKey, interval, fromDate, toDate) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.HistoricalDataApi();
    const apiVersion = "2.0";

    return apiInstance.getHistoricalCandle(
        instrumentKey, 
        interval, 
        fromDate.toISOString(), 
        toDate.toISOString(), 
        apiVersion
    )
        .then(data => {
            console.log('Historical data retrieved successfully');
            return data.data.candles;
        })
        .catch(error => {
            console.error('Error retrieving historical data:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Get master instruments list
 * Retrieves list of all available trading instruments for a segment
 * 
 * @param {string} accessToken - Authentication token
 * @param {string} segment - Exchange segment: "NSE_EQ", "BSE_EQ", "NSE_FO", "BSE_FO", etc.
 * @returns {Promise} - Master instruments response with array of instruments
 */
function getMasterInstruments(accessToken, segment) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.MarketDataApi();
    const apiVersion = "2.0";

    return apiInstance.getMasterInstruments(segment, apiVersion)
        .then(data => {
            console.log(`Master instruments list for ${segment} retrieved successfully. Total instruments: ${data.instruments.length}`);
            return data.instruments;
        })
        .catch(error => {
            console.error('Error retrieving master instruments:', error.response ? error.response.text : error);
            throw error;
        });
}

/**
 * Get market status
 * Retrieves current market status (open/closed) for exchanges
 * 
 * @param {string} accessToken - Authentication token
 * @returns {Promise} - Market status response
 */
function getMarketStatus(accessToken) {
    initializeUpstoxClient(accessToken);
    const apiInstance = new UpstoxClient.MarketDataApi();
    const apiVersion = "2.0";

    return apiInstance.getMarketStatus(apiVersion)
        .then(data => {
            console.log('Market status retrieved successfully:', data.market_status);
            return data.market_status;
        })
        .catch(error => {
            console.error('Error retrieving market status:', error.response ? error.response.text : error);
            throw error;
        });
}

// =========================================================
// USAGE EXAMPLES
// =========================================================

/*
// Example usage
const accessToken = "YOUR_ACCESS_TOKEN";

// Place a market buy order
placeMarketOrder(accessToken, "NSE_EQ|INE528G01035", 1, "BUY", "I", false)
    .then(orderData => {
        console.log("Market order successfully placed:", orderData);
    })
    .catch(error => {
        console.error("Failed to place market order:", error);
    });

// Get order book
getOrderBook(accessToken)
    .then(orderBook => {
        console.log("Order book:", orderBook);
    })
    .catch(error => {
        console.error("Failed to get order book:", error);
    });

// Connect to market data websocket and subscribe to instruments
connectToMarketDataWebSocket(accessToken)
    .then(ws => {
        subscribeToMarketData(ws, ["NSE_EQ|INE528G01035", "NSE_EQ|INE669E01016"]);
        
        // Unsubscribe after 5 minutes
        setTimeout(() => {
            unsubscribeFromMarketData(ws, ["NSE_EQ|INE528G01035"]);
        }, 5 * 60 * 1000);
    })
    .catch(error => {
        console.error("Failed to connect to market data websocket:", error);
    });
*/

// Export all functions
module.exports = {
    // Order Management
    placeMarketOrder,
    placeLimitOrder,
    placeStopLossMarketOrder,
    placeStopLossLimitOrder,
    modifyOrder,
    cancelOrder,
    getOrderDetails,
    getOrderBook,
    getTradeBook,
    
    // Profile & Account
    getUserProfile,
    
    // Funds & Margins
    getFundDetails,
    getPositions,
    getHoldings,
    
    // WebSocket
    connectToMarketDataWebSocket,
    subscribeToMarketData,
    unsubscribeFromMarketData,
    connectToOrderWebSocket,
    
    // Miscellaneous
    getMarketQuotes,
    getHistoricalData,
    getMasterInstruments,
    getMarketStatus
}; 
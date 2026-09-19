package com.promptworks.sinbarreras;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.view.WindowInsets;
import android.window.OnBackInvokedDispatcher;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryProductDetailsResult;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity implements PurchasesUpdatedListener {
    private static final int WEB_PERMISSION_REQUEST = 1201;
    private static final int FILE_CHOOSER_REQUEST = 1202;
    private static final String PRODUCT_ID = BuildConfig.PLAY_SUBSCRIPTION_PRODUCT_ID;
    private static final String TRIAL_OFFER_TAG = BuildConfig.PLAY_TRIAL_OFFER_TAG;
    private static final String TRUSTED_HOST = BuildConfig.WEB_APP_HOST;

    private WebView webView;
    private BillingClient billingClient;
    private PermissionRequest pendingWebPermissionRequest;
    private ValueCallback<Uri[]> fileChooserCallback;
    private Runnable billingConnectedAction;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        webView = findViewById(R.id.webview);

        configureSystemInsets();
        configureWebView();
        configureBilling();
        configureBackNavigation();

        if (savedInstanceState == null) {
            webView.loadUrl(BuildConfig.WEB_APP_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setUserAgentString(settings.getUserAgentString() + " SinBarrerasAndroid/" + BuildConfig.VERSION_NAME);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) settings.setSafeBrowsingEnabled(true);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, false);

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        webView.addJavascriptInterface(new NativeBridge(), "SinBarrerasNative");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNavigation(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleNavigation(Uri.parse(url));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.evaluateJavascript("document.documentElement.classList.add('android-app')", null);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> handleWebPermissionRequest(request));
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pendingWebPermissionRequest == request) pendingWebPermissionRequest = null;
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = filePathCallback;
                try {
                    startActivityForResult(fileChooserParams.createIntent(), FILE_CHOOSER_REQUEST);
                    return true;
                } catch (ActivityNotFoundException error) {
                    fileChooserCallback = null;
                    Toast.makeText(MainActivity.this, "No hay una app disponible para seleccionar este archivo.", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
    }

    private void configureSystemInsets() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            webView.setOnApplyWindowInsetsListener((view, windowInsets) -> {
                Insets bars = windowInsets.getInsets(WindowInsets.Type.systemBars());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return windowInsets;
            });
            webView.requestApplyInsets();
        }
    }

    private void configureBackNavigation() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                    this::handleBack
            );
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            handleBack();
            return;
        }
        super.onBackPressed();
    }

    private void handleBack() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else finish();
    }

    private boolean handleNavigation(Uri uri) {
        if (uri == null) return true;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.US);
        String host = uri.getHost() == null ? "" : uri.getHost();
        if ("https".equals(scheme) && TRUSTED_HOST.equalsIgnoreCase(host)) return false;

        if ("http".equals(scheme) || "https".equals(scheme) || "mailto".equals(scheme) || "tel".equals(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException error) {
                Toast.makeText(this, "No se pudo abrir este enlace.", Toast.LENGTH_SHORT).show();
            }
            return true;
        }
        return true;
    }

    private boolean isTrustedOrigin(Uri origin) {
        return origin != null
                && "https".equalsIgnoreCase(origin.getScheme())
                && TRUSTED_HOST.equalsIgnoreCase(origin.getHost());
    }

    private void handleWebPermissionRequest(PermissionRequest request) {
        if (!isTrustedOrigin(request.getOrigin())) {
            request.deny();
            return;
        }

        List<String> androidPermissions = new ArrayList<>();
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)
                    && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                androidPermissions.add(Manifest.permission.RECORD_AUDIO);
            }
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)
                    && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                androidPermissions.add(Manifest.permission.CAMERA);
            }
        }

        if (!androidPermissions.isEmpty()) {
            pendingWebPermissionRequest = request;
            requestPermissions(androidPermissions.toArray(new String[0]), WEB_PERMISSION_REQUEST);
            return;
        }
        grantAllowedWebResources(request);
    }

    private void grantAllowedWebResources(PermissionRequest request) {
        List<String> allowed = new ArrayList<>();
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)
                    && checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                allowed.add(resource);
            }
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)
                    && checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                allowed.add(resource);
            }
        }
        if (allowed.isEmpty()) request.deny();
        else request.grant(allowed.toArray(new String[0]));
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == WEB_PERMISSION_REQUEST && pendingWebPermissionRequest != null) {
            PermissionRequest request = pendingWebPermissionRequest;
            pendingWebPermissionRequest = null;
            grantAllowedWebResources(request);
        }
    }

    private void configureBilling() {
        PendingPurchasesParams pendingPurchasesParams = PendingPurchasesParams.newBuilder()
                .enableOneTimeProducts()
                .build();

        billingClient = BillingClient.newBuilder(this)
                .setListener(this)
                .enablePendingPurchases(pendingPurchasesParams)
                .enableAutoServiceReconnection()
                .build();
        connectBilling(null);
    }

    private void connectBilling(Runnable whenConnected) {
        if (billingClient == null) return;
        if (billingClient.isReady()) {
            if (whenConnected != null) whenConnected.run();
            return;
        }
        if (whenConnected != null) billingConnectedAction = whenConnected;
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Runnable action = billingConnectedAction;
                    billingConnectedAction = null;
                    if (action != null) action.run();
                } else {
                    notifyWebError("Google Play Billing no está disponible: " + billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // enableAutoServiceReconnection() handles the next API request.
            }
        });
    }

    private void startSubscriptionPurchase(String accountId) {
        runOnUiThread(() -> connectBilling(() -> querySubscriptionAndLaunch(accountId)));
    }

    private void querySubscriptionAndLaunch(String accountId) {
        querySubscriptionDetails((details, selectedOffer) -> {
            BillingFlowParams.ProductDetailsParams productParams = BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(details)
                    .setOfferToken(selectedOffer.getOfferToken())
                    .build();
            BillingFlowParams.Builder flowBuilder = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(productParams));

            String obfuscatedAccountId = sha256(accountId);
            if (!obfuscatedAccountId.isEmpty()) flowBuilder.setObfuscatedAccountId(obfuscatedAccountId);

            notifyWebOffer(details, selectedOffer);
            BillingResult launchResult = billingClient.launchBillingFlow(MainActivity.this, flowBuilder.build());
            if (launchResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                notifyWebError("Google Play no pudo abrir el pago: " + launchResult.getDebugMessage());
            }
        });
    }

    private void refreshSubscriptionOffer() {
        runOnUiThread(() -> connectBilling(() -> querySubscriptionDetails(this::notifyWebOffer)));
    }

    private interface SubscriptionOfferCallback {
        void onReady(ProductDetails details, ProductDetails.SubscriptionOfferDetails selectedOffer);
    }

    private void querySubscriptionDetails(SubscriptionOfferCallback callback) {
        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PRODUCT_ID)
                .setProductType(BillingClient.ProductType.SUBS)
                .build();
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(product))
                .build();

        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(BillingResult billingResult, QueryProductDetailsResult result) {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    notifyWebError("No se pudo cargar el plan de Google Play: " + billingResult.getDebugMessage());
                    return;
                }
                List<ProductDetails> detailsList = result.getProductDetailsList();
                if (detailsList == null || detailsList.isEmpty()) {
                    notifyWebError("El plan de Sin Barreras todavía no está disponible en Google Play para esta cuenta.");
                    return;
                }

                ProductDetails details = detailsList.get(0);
                List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                if (offers == null || offers.isEmpty()) {
                    notifyWebError("No hay una oferta de suscripción disponible para este usuario.");
                    return;
                }

                ProductDetails.SubscriptionOfferDetails selectedOffer = selectPreferredOffer(offers);
                if (selectedOffer == null) {
                    notifyWebError("Google Play no devolvió un plan elegible para esta cuenta.");
                    return;
                }
                callback.onReady(details, selectedOffer);
            }
        });
    }

    private ProductDetails.SubscriptionOfferDetails selectPreferredOffer(List<ProductDetails.SubscriptionOfferDetails> offers) {
        ProductDetails.SubscriptionOfferDetails anySevenDayTrial = null;
        ProductDetails.SubscriptionOfferDetails regularBasePlan = null;

        for (ProductDetails.SubscriptionOfferDetails offer : offers) {
            if (offer == null) continue;
            boolean sevenDayTrial = hasSevenDayFreeTrial(offer);
            List<String> tags = offer.getOfferTags();
            boolean preferredTag = tags != null && tags.contains(TRIAL_OFFER_TAG);
            if (sevenDayTrial && preferredTag) return offer;
            if (sevenDayTrial && anySevenDayTrial == null) anySevenDayTrial = offer;
            if (offer.getOfferId() == null && regularBasePlan == null) regularBasePlan = offer;
        }

        if (anySevenDayTrial != null) return anySevenDayTrial;
        if (regularBasePlan != null) return regularBasePlan;
        return offers.get(0);
    }

    private boolean hasSevenDayFreeTrial(ProductDetails.SubscriptionOfferDetails offer) {
        if (offer == null || offer.getPricingPhases() == null) return false;
        List<ProductDetails.PricingPhase> phases = offer.getPricingPhases().getPricingPhaseList();
        if (phases == null) return false;
        for (ProductDetails.PricingPhase phase : phases) {
            if (phase != null
                    && phase.getPriceAmountMicros() == 0L
                    && "P7D".equalsIgnoreCase(phase.getBillingPeriod())) return true;
        }
        return false;
    }

    private String paidFormattedPrice(ProductDetails.SubscriptionOfferDetails offer) {
        if (offer == null || offer.getPricingPhases() == null) return "";
        List<ProductDetails.PricingPhase> phases = offer.getPricingPhases().getPricingPhaseList();
        if (phases == null) return "";
        for (int index = phases.size() - 1; index >= 0; index--) {
            ProductDetails.PricingPhase phase = phases.get(index);
            if (phase != null && phase.getPriceAmountMicros() > 0L) return phase.getFormattedPrice();
        }
        return "";
    }

    private void notifyWebOffer(ProductDetails details, ProductDetails.SubscriptionOfferDetails offer) {
        if (webView == null || details == null || offer == null) return;
        try {
            JSONObject payload = new JSONObject();
            payload.put("productId", details.getProductId());
            payload.put("basePlanId", offer.getBasePlanId());
            payload.put("offerId", offer.getOfferId() == null ? "" : offer.getOfferId());
            payload.put("hasFreeTrial", hasSevenDayFreeTrial(offer));
            payload.put("freeTrialDays", hasSevenDayFreeTrial(offer) ? 7 : 0);
            payload.put("formattedPrice", paidFormattedPrice(offer));
            payload.put("preferredTrialTag", TRIAL_OFFER_TAG);
            String script = "window.SinBarrerasPlay&&window.SinBarrerasPlay.onOffer(" + JSONObject.quote(payload.toString()) + ");";
            runOnUiThread(() -> webView.evaluateJavascript(script, null));
        } catch (Exception ignored) {}
    }

    private void restorePurchases() {
        runOnUiThread(() -> connectBilling(() -> {
            QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build();
            billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) return;
                for (Purchase purchase : purchases) processPurchase(purchase);
            });
        }));
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) processPurchase(purchase);
            return;
        }
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) return;
        notifyWebError("Google Play Billing no pudo completar la compra: " + billingResult.getDebugMessage());
    }

    private void processPurchase(Purchase purchase) {
        if (purchase == null || !purchase.getProducts().contains(PRODUCT_ID)) return;
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            notifyWebError("La compra está pendiente. El acceso se activará cuando Google Play confirme el pago.");
            return;
        }
        if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return;

        try {
            JSONObject payload = new JSONObject();
            payload.put("productId", PRODUCT_ID);
            payload.put("purchaseToken", purchase.getPurchaseToken());
            payload.put("orderId", purchase.getOrderId() == null ? "" : purchase.getOrderId());
            payload.put("acknowledged", purchase.isAcknowledged());
            notifyWebPurchase(payload.toString());
        } catch (Exception error) {
            notifyWebError("No se pudo procesar la compra de Google Play.");
        }
    }

    private void acknowledgePurchase(String token) {
        if (token == null || token.trim().isEmpty()) return;
        runOnUiThread(() -> connectBilling(() -> {
            AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(token.trim())
                    .build();
            billingClient.acknowledgePurchase(params, billingResult -> {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK
                        && billingResult.getResponseCode() != BillingClient.BillingResponseCode.ITEM_NOT_OWNED) {
                    notifyWebError("La compra fue verificada, pero Google Play no pudo confirmarla todavía.");
                }
            });
        }));
    }

    private void manageSubscription() {
        runOnUiThread(() -> {
            Uri uri = Uri.parse("https://play.google.com/store/account/subscriptions?sku="
                    + Uri.encode(PRODUCT_ID) + "&package=" + Uri.encode(getPackageName()));
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException error) {
                notifyWebError("No se pudo abrir la administración de suscripciones de Google Play.");
            }
        });
    }

    private void notifyWebPurchase(String payloadJson) {
        if (webView == null) return;
        String script = "window.SinBarrerasPlay&&window.SinBarrerasPlay.onPurchase(" + JSONObject.quote(payloadJson) + ");";
        runOnUiThread(() -> webView.evaluateJavascript(script, null));
    }

    private void notifyWebError(String message) {
        if (webView == null) return;
        String script = "window.SinBarrerasPlay&&window.SinBarrerasPlay.onBillingError(" + JSONObject.quote(message) + ");";
        runOnUiThread(() -> webView.evaluateJavascript(script, null));
    }

    private String sha256(String value) {
        if (value == null || value.trim().isEmpty()) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(hash.length * 2);
            for (byte item : hash) result.append(String.format(Locale.US, "%02x", item));
            return result.toString();
        } catch (Exception ignored) {
            return "";
        }
    }

    public final class NativeBridge {
        @JavascriptInterface
        public boolean isAndroidApp() {
            return true;
        }

        @JavascriptInterface
        public void startSubscriptionPurchase(String accountId) {
            MainActivity.this.startSubscriptionPurchase(accountId);
        }

        @JavascriptInterface
        public void refreshSubscriptionOffer() {
            MainActivity.this.refreshSubscriptionOffer();
        }

        @JavascriptInterface
        public void restorePurchases() {
            MainActivity.this.restorePurchases();
        }

        @JavascriptInterface
        public void manageSubscription() {
            MainActivity.this.manageSubscription();
        }

        @JavascriptInterface
        public void acknowledgePurchase(String purchaseToken) {
            MainActivity.this.acknowledgePurchase(purchaseToken);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || fileChooserCallback == null) return;
        Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        fileChooserCallback.onReceiveValue(result);
        fileChooserCallback = null;
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (billingClient != null && !billingClient.isReady()) connectBilling(null);
    }

    @Override
    protected void onDestroy() {
        if (fileChooserCallback != null) {
            fileChooserCallback.onReceiveValue(null);
            fileChooserCallback = null;
        }
        if (billingClient != null) billingClient.endConnection();
        if (webView != null) {
            webView.removeJavascriptInterface("SinBarrerasNative");
            webView.destroy();
        }
        super.onDestroy();
    }
}

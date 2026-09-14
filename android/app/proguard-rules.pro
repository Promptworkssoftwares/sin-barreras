# JavaScript bridge methods are invoked by WebView reflection.
-keepclassmembers class com.promptworks.sinbarreras.MainActivity$NativeBridge {
    @android.webkit.JavascriptInterface <methods>;
}

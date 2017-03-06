package com.beetle.goubuli;

import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.xiaomi.mipush.sdk.MiPushClient;

/**
 * Created by houxh on 2017/3/6.
 */

public class XiaoMiModule extends ReactContextBaseJavaModule {
    static private XiaoMiModule instance;
    private String mXiaomiPushToken = "";

    @Override
    public String getName() {
        return "XiaoMi";
    }


    public XiaoMiModule(ReactApplicationContext reactContext) {
        super(reactContext);
        instance = this;

    }

    static public XiaoMiModule getInstance() {
        return instance;
    }

    public void setXiaomiPushToken(String token) {
        this.mXiaomiPushToken = token;
        WritableMap map = Arguments.createMap();
        map.putString("device_token", token);
        this.sendEvent(getReactApplicationContext(), "xiaomi_device_token", map);
    }

    private void sendEvent(ReactContext reactContext,
                           String eventName,
                           @Nullable WritableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    @ReactMethod
    private void register() {
        // 注册push服务，注册成功后会向XiaomiPushReceiver发送广播
        // 可以从onCommandResult方法中MiPushCommandMessage对象参数中获取注册信息
        String appId = "2882303761517554371";
        String appKey = "5191755442371";
        MiPushClient.registerPush(MainApplication.getInstance(), appId, appKey);
    }

}

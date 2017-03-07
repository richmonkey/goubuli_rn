package com.beetle.goubuli;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;

import com.airbnb.android.react.maps.MapsPackage;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.oblador.vectoricons.VectorIconsPackage;
import com.rnfs.RNFSPackage;
import com.zmxv.RNSound.RNSoundPackage;
import com.remobile.toast.RCTToastPackage;
import com.rnim.rn.audio.ReactNativeAudioPackage;
import com.imagepicker.ImagePickerPackage;

import com.facebook.react.ReactPackage;
import com.reactnativenavigation.NavigationApplication;

import org.pgsqlite.SQLitePluginPackage;

import java.util.Arrays;
import java.util.List;


public class MainApplication extends NavigationApplication implements Application.ActivityLifecycleCallbacks {
    @Override
    public boolean isDebug() {
        // Make sure you are using BuildConfig from your own application
        return BuildConfig.DEBUG;
    }

    static public MainApplication getInstance() {
        return (MainApplication)instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        registerActivityLifecycleCallbacks(this);
    }

    @NonNull
    @Override
    public List<ReactPackage> createAdditionalReactPackages() {
        // Add the packages you require here.
        // No need to add RnnPackage and MainReactPackage
        return Arrays.<ReactPackage>asList(
                new MapsPackage(),
                new RNFSPackage(),
                new RNSoundPackage(),
                new RCTToastPackage(),
                new ReactNativeAudioPackage(),
                new ImagePickerPackage(),
                new SQLitePluginPackage(),
                new LocationPackage(),
                new VectorIconsPackage()
        );
    }


    private final static String TAG = "beetle";
    private int started = 0;
    private int stopped = 0;

    public void onActivityCreated(Activity activity, Bundle bundle) {
        Log.i("","onActivityCreated:" + activity.getLocalClassName());
    }

    public void onActivityDestroyed(Activity activity) {
        Log.i("","onActivityDestroyed:" + activity.getLocalClassName());
    }

    public void onActivityPaused(Activity activity) {
        Log.i("","onActivityPaused:" + activity.getLocalClassName());
    }

    public void onActivityResumed(Activity activity) {
        Log.i("","onActivityResumed:" + activity.getLocalClassName());
    }

    public void onActivitySaveInstanceState(Activity activity,
                                            Bundle outState) {
        Log.i("","onActivitySaveInstanceState:" + activity.getLocalClassName());
    }

    public void onActivityStarted(Activity activity) {
        Log.i("","onActivityStarted:" + activity.getLocalClassName());
        ++started;

        if (started - stopped == 1 ) {
            if (stopped == 0) {
                Log.i(TAG, "app startup");
            } else {
                Log.i(TAG, "app enter foreground");
                WritableMap map = Arguments.createMap();
                map.putString("state", "active");
                this.getEventEmitter().sendNavigatorEvent("app_state", map);
            }
        }
    }

    public void onActivityStopped(Activity activity) {
        Log.i("","onActivityStopped:" + activity.getLocalClassName());
        ++stopped;
        if (stopped == started) {
            Log.i(TAG, "app enter background");
            WritableMap map = Arguments.createMap();
            map.putString("state", "background");
            this.getEventEmitter().sendNavigatorEvent("app_state", map);
        }
    }
}

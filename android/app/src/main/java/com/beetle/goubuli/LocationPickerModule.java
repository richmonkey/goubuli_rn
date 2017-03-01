package com.beetle.goubuli;

import android.app.Activity;
import android.content.Intent;

import com.amap.api.services.geocoder.GeocodeResult;
import com.amap.api.services.geocoder.GeocodeSearch;
import com.amap.api.services.geocoder.RegeocodeResult;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

/**
 * Created by houxh on 2017/2/28.
 */


public class LocationPickerModule extends ReactContextBaseJavaModule {
    private static final int LOCATION_PICKER_REQUEST = 60081;

    private static final String E_PICKER_CANCELLED = "E_PICKER_CANCELLED";

    private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (requestCode == LOCATION_PICKER_REQUEST) {
                if (mPickerPromise != null) {
                    if (resultCode == Activity.RESULT_CANCELED) {
                        mPickerPromise.reject(E_PICKER_CANCELLED, "Image picker was cancelled");
                    } else if (resultCode == Activity.RESULT_OK) {
                        float longitude = data.getFloatExtra("longitude", 0);
                        float latitude = data.getFloatExtra("latitude", 0);
                        String address = data.getStringExtra("address");

                        WritableMap map = Arguments.createMap();

                        map.putDouble("longitude", longitude);
                        map.putDouble("latitude", latitude);
                        map.putString("address", address);

                        mPickerPromise.resolve(map);
                    }
                    mPickerPromise = null;
                }
            }
        }
    };

    Promise mPickerPromise;

    public LocationPickerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(mActivityEventListener);
    }

    @Override
    public String getName() {
        return "LocationPicker";
    }
    @ReactMethod
    public void pickLocation(final Promise promise) {
        mPickerPromise = promise;
        Activity currentActivity = getCurrentActivity();
        Intent intent = new Intent(getReactApplicationContext(), LocationPickerActivity.class);
        currentActivity.startActivityForResult(intent, LOCATION_PICKER_REQUEST);
    }

    @ReactMethod
    public void queryLocation(double l, double lat, final Promise promise) {

        GeocodeSearch.OnGeocodeSearchListener listener = new GeocodeSearch.OnGeocodeSearchListener() {

            @Override
            public void onRegeocodeSearched(RegeocodeResult result, int rCode) {
                if (rCode == 0 && result != null && result.getRegeocodeAddress() != null) {
                    String address;
                    if (result.getRegeocodeAddress().getPois() != null && result.getRegeocodeAddress().getPois().size() > 0) {
                        address = result.getRegeocodeAddress().getPois().get(0).getTitle();
                    } else {
                        address = result.getRegeocodeAddress().getFormatAddress();
                    }
                    //setLocation(latitude, longitude, address);
                } else {
                    // 定位失败;
                }
            }

            @Override
            public void onGeocodeSearched(GeocodeResult geocodeResult, int i) {
            }
        };
        GeocodeSearch mGeocodeSearch = new GeocodeSearch(this.getReactApplicationContext());
        mGeocodeSearch.setOnGeocodeSearchListener(listener);
    }
}
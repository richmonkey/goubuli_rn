package com.beetle.goubuli;

import android.support.annotation.NonNull;

import com.airbnb.android.react.maps.MapsPackage;
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




public class MainApplication extends NavigationApplication {
  @Override
  public boolean isDebug() {
    // Make sure you are using BuildConfig from your own application
    return BuildConfig.DEBUG;
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
}

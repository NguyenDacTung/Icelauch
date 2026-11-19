package com.icelauch.app;

import android.content.pm.ActivityInfo;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenOrientation")
public class ScreenOrientationPlugin extends Plugin {

    @PluginMethod
    public void lockLandscape(PluginCall call) {
        if (getActivity() != null) {
            getActivity().runOnUiThread(() -> {
                try {
                    getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                    call.resolve();
                } catch (Exception e) {
                    call.reject("Không thể khóa hướng ngang: " + e.getMessage());
                }
            });
        } else {
            call.reject("Activity null");
        }
    }

    @PluginMethod
    public void unlock(PluginCall call) {
        if (getActivity() != null) {
            getActivity().runOnUiThread(() -> {
                try {
                    getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                    call.resolve();
                } catch (Exception e) {
                    call.reject("Không thể mở khóa hướng: " + e.getMessage());
                }
            });
        } else {
            call.reject("Activity null");
        }
    }

    @PluginMethod
    public void lockPortrait(PluginCall call) {
        if (getActivity() != null) {
            getActivity().runOnUiThread(() -> {
                try {
                    getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                    call.resolve();
                } catch (Exception e) {
                    call.reject("Không thể khóa hướng dọc: " + e.getMessage());
                }
            });
        } else {
            call.reject("Activity null");
        }
    }
}

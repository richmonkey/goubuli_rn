package com.beetle.goubuli;


import android.os.Bundle;
import android.support.v7.app.ActionBar;
import android.support.v7.app.ActionBarActivity;
import android.view.MenuItem;


/**
 * Created by tsung on 12/10/14.
 */
public class BaseActivity extends ActionBarActivity {
    protected ActionBar actionBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onResume() {
        super.onResume();


        actionBar = getSupportActionBar();
        if (actionBar != null) {
            if (canBack()) {
                actionBar.setDisplayHomeAsUpEnabled(true);
            } else {
                actionBar.setDisplayHomeAsUpEnabled(false);
            }
            actionBar.show();
        }
    }

    @Override
    protected void onStop() {
        super.onStop();


    }

    public boolean canBack() {
        return true;
    }

    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                if (canBack()) {
                    onBackPressed();
                    return true;
                }
        }
        return false;
    }


}

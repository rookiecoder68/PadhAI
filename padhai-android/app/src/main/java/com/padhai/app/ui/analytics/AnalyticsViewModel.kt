package com.padhai.app.ui.analytics

import android.content.Context
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.padhai.app.data.model.RewardData
import com.padhai.app.utils.RewardsManager
import kotlinx.coroutines.launch

class AnalyticsViewModel : ViewModel() {
    
    private val _rewardData = MutableLiveData<RewardData>()
    val rewardData: LiveData<RewardData> = _rewardData
    
    fun loadRewards(context: Context) {
        viewModelScope.launch {
            val data = RewardsManager.getRewardData(context)
            _rewardData.value = data
        }
    }
    
    fun refreshRewards(context: Context) {
        loadRewards(context)
    }
}

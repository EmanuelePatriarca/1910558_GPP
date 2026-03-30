import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { SensorDashboardState, SensorEventRequestEnum, Event } from '../../../../core/models/sensor.model';

@Component({
  selector: 'app-event-distribution-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  template: `
    <div echarts [options]="chartOptions()" class="w-full h-full min-h-[200px]"></div>
  `,
  host: { class: 'block w-full h-full flex items-center justify-center' }
})
export class EventDistributionChartComponent {
  sensors = input.required<SensorDashboardState[]>();
  events = input.required<Event[]>(); // Aggiornato per ricevere l'intero storico globale

  chartOptions = computed<EChartsOption>(() => {
    const sList = this.sensors();
    const eList = this.events();
    
    // Labels Truncate Asse X
    const xData = sList.map(s => s.name.length > 12 ? s.name.substring(0, 10) + '...' : s.name);
    
    // Elaborazione Aggregativa ECharts
    const seriesData = sList.map(s => {
      // Ottieni tutti gli eventi che matchano questo sensore
      const sensorEvents = eList.filter(e => e.sensor_id === s.id);
      
      const total = sensorEvents.length;
      const earthquakes = sensorEvents.filter(e => e.category_event === SensorEventRequestEnum.EARTHQUAKE).length;
      const explosions = sensorEvents.filter(e => e.category_event === SensorEventRequestEnum.CONVENTIONAL_EXPLOSION).length;
      const nuclear = sensorEvents.filter(e => e.category_event === SensorEventRequestEnum.NUCLEAR_LIKE).length;
      
      // Colore uniforme per tutte le barre come da richiesta
      const color = '#6366f1'; // indigo-500 (colore primario del tema App)

      return {
        value: total,
        itemStyle: { color },
        // Custom Data Envelope per il Tooltip
        customPayload: { earthquakes, explosions, nuclear, name: s.name }
      };
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15, 23, 42, 0.95)', // slage-900 misto
        borderColor: '#334155',
        textStyle: { color: '#f8fafc' },
        formatter: (params: any) => {
          const item = params[0].data;
          const { earthquakes, explosions, nuclear, name } = item.customPayload;
          const total = item.value;
          
          return `
            <div class="font-bold border-b border-slate-700 pb-1 mb-1">${name}</div>
            <div class="text-xs min-w-[150px]">
               <div class="flex justify-between items-center mb-1">
                   <span class="opacity-80 uppercase tracking-widest text-[9px] font-bold">Total Events</span> 
                   <span class="font-bold text-slate-100">${total}</span>
               </div>
               ${total > 0 ? `
               <div class="mt-2 flex flex-col gap-1">
                  <div class="flex justify-between items-center gap-4">
                     <span class="text-yellow-400">Earthquakes:</span>
                     <span class="font-mono text-slate-300">${earthquakes}</span>
                  </div>
                  <div class="flex justify-between items-center gap-4">
                     <span class="text-amber-500">Explosions:</span>
                     <span class="font-mono text-slate-300">${explosions}</span>
                  </div>
                  <div class="flex justify-between items-center gap-4">
                     <span class="text-red-500">Nuclear Threats:</span>
                     <span class="font-mono text-slate-300 font-bold">${nuclear}</span>
                  </div>
               </div>` : '<div class="text-slate-500 italic mt-2 text-center text-[10px]">No historical threats recorded</div>'}
            </div>
          `;
        }
      },
      grid: {
        top: 45,
        right: 20,
        bottom: 20,
        left: 45,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { 
          color: '#64748b', 
          fontSize: 9,
          interval: 0,
          rotate: 45 
        }
      },
      yAxis: {
        type: 'value',
        name: 'Alerts',
        nameTextStyle: { color: '#64748b', fontSize: 10, align: 'right' },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 }
      },
      series: [
        {
          name: 'Total Events',
          data: seriesData,
          type: 'bar',
          barWidth: '40%',
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          animationDuration: 800,
          animationEasing: 'cubicOut'
        }
      ]
    };
  });
}

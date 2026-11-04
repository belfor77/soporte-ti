const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
test('SLA sigue funcionando en navegador aunque no cargue notebook-renewal.js',()=>{
 const window={};
 const context=vm.createContext({window,Intl,Date,Map,Set,console});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../support-insights.js'),'utf8'),context);
 const ticket={created_at:'2026-10-01T12:00:00Z',estado:'abierto',sla_deadline:'2026-10-02T12:00:00Z'};
 assert.equal(window.SupportInsights.ticketSla(ticket,new Date('2026-10-03T12:00:00Z')),'incumplido');
 assert.equal(window.SupportInsights.ticketSla({...ticket,created_at:'2026-02-30T12:00:00Z'}),'sin_medicion');
});

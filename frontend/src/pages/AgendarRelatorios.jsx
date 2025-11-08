import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/index.css';
import '../styles/app.css';

const WEEKDAYS = [
  { key: 1, label: 'Seg' },
  { key: 2, label: 'Ter' },
  { key: 3, label: 'Qua' },
  { key: 4, label: 'Qui' },
  { key: 5, label: 'Sex' },
  { key: 6, label: 'Sáb' },
  { key: 0, label: 'Dom' },
];

export default function AgendarRelatorios(){
  const navigate = useNavigate();
  const location = useLocation();
  const admin = location.state?.usuario;

  const [nome, setNome] = useState('');
  const [reportType, setReportType] = useState('lista');
  const [formato, setFormato] = useState('pdf');
  const [scheduleType, setScheduleType] = useState('diario');
  const [hora, setHora] = useState('09:00');
  const [dataOneTime, setDataOneTime] = useState('');
  const [emailsInput, setEmailsInput] = useState('');
  const [emails, setEmails] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // scheduling details
  const [weeklyDays, setWeeklyDays] = useState([1]); // Monday default
  const [monthlyDay, setMonthlyDay] = useState(1); // day of month (1..31) or 0 for last day

  useEffect(()=>{ fetchSchedules(); }, []);

  async function fetchSchedules(){
    try{
      const res = await fetch('http://localhost:3000/schedules');
      if(!res.ok) throw new Error('Erro');
      const data = await res.json();
      setSchedules(data);
    }catch(err){ console.error(err); }
  }

  function toggleWeekday(dayKey){
    setWeeklyDays(prev => prev.includes(dayKey) ? prev.filter(d=>d!==dayKey) : [...prev, dayKey]);
  }

  function addEmail(){ if(!emailsInput) return; setEmails(prev=>[...prev, emailsInput]); setEmailsInput(''); }
  function removeEmail(idx){ setEmails(prev=>prev.filter((_,i)=>i!==idx)); }

  function buildCronForSchedule(){
    const [hh, mm] = hora.split(':');
    if(scheduleType === 'diario') return `${mm} ${hh} * * *`;
    if(scheduleType === 'semanal'){
      if(!weeklyDays || weeklyDays.length===0) return null;
      const dow = weeklyDays.join(',');
      return `${mm} ${hh} * * ${dow}`;
    }
    if(scheduleType === 'mensal'){
      if(monthlyDay === 0) return `${mm} ${hh} L * *`; // 'L' not supported by cron lib; will store special marker
      return `${mm} ${hh} ${monthlyDay} * *`;
    }
    return null;
  }

  async function criar(){
    try{
      const payload = {
        nome,
        report_type: reportType,
        formato,
        empresa: admin?.empresa || 'U',
        emails,
      };

      if(scheduleType === 'one-time'){
        payload.tipo_agendamento = 'one-time';
        payload.start_at = dataOneTime ? new Date(`${dataOneTime}T${hora}:00`).toISOString() : null;
      } else if (scheduleType === 'first-business-day'){
        payload.tipo_agendamento = 'recorrente';
        payload.cron_expr = `FIRST_BUSINESS_DAY@${hora}`;
      } else {
        payload.tipo_agendamento = 'recorrente';
        // weekly/monthly/diario
        const cronExpr = buildCronForSchedule();
        if(!cronExpr) { alert('Selecione pelo menos um dia para agendamento semanal/mensal'); return; }
        // handle 'L' marker for monthly last day: store as special token
        if(scheduleType === 'mensal' && monthlyDay === 0){
          payload.cron_expr = `MONTHLY_LAST@${hora}`;
        } else {
          payload.cron_expr = cronExpr;
        }
      }

      const res = await fetch('http://localhost:3000/schedules',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!res.ok) throw new Error('Erro ao criar');
      alert('Agendamento criado');
      setNome(''); setEmails([]); fetchSchedules();
    }catch(err){ console.error(err); alert('Erro ao criar agendamento'); }
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-card" style={{maxWidth:700}}>
        <h2 style={{textAlign:'center'}}>Agendar Relatórios</h2>

        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <input placeholder="nome do agendamento" value={nome} onChange={e=>setNome(e.target.value)} style={{flex:1,padding:8}} />
          <select value={reportType} onChange={e=>setReportType(e.target.value)} style={{padding:8}}>
            <option value="lista">Lista de Funcionários</option>
            <option value="presenca">Registro de Presença</option>
            <option value="beneficios">Benefícios</option>
            <option value="folha">Folha de Pagamento</option>
          </select>
          <select value={formato} onChange={e=>setFormato(e.target.value)} style={{padding:8}}>
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel</option>
          </select>
        </div>

        <div style={{marginTop:12}}>
          <label>Empresa</label>
          <div style={{background:'#1b5e20',padding:10,color:'#fff',width:120,textAlign:'center',borderRadius:6}}>{admin?.empresa || 'U'}</div>
        </div>

        <div style={{marginTop:12}}>
          <label>Tipo de agendamento</label>
          <select value={scheduleType} onChange={e=>setScheduleType(e.target.value)} style={{width:200,padding:8,display:'block'}}>
            <option value="diario">Diário (horário)</option>
            <option value="semanal">Semanal (escolher dias)</option>
            <option value="mensal">Mensal (escolher dia)</option>
            <option value="first-business-day">1º dia útil</option>
            <option value="one-time">Uma vez</option>
          </select>

          <div style={{marginTop:8}}>
            <label>Hora</label>
            <input type="time" value={hora} onChange={e=>setHora(e.target.value)} style={{marginLeft:8}} />
          </div>

          {scheduleType === 'one-time' && (
            <div style={{marginTop:8}}>
              <label>Data</label>
              <input type="date" value={dataOneTime} onChange={e=>setDataOneTime(e.target.value)} style={{marginLeft:8}} />
            </div>
          )}

          {scheduleType === 'semanal' && (
            <div style={{marginTop:8}}>
              <label>Escolha os dias da semana</label>
              <div style={{display:'flex',gap:8,marginTop:6}}>
                {WEEKDAYS.map(w => (
                  <button key={w.key} className={weeklyDays.includes(w.key)?'btn-gradient':'btn-gradient-secondary'} onClick={()=>toggleWeekday(w.key)} type="button">{w.label}</button>
                ))}
              </div>
            </div>
          )}

          {scheduleType === 'mensal' && (
            <div style={{marginTop:8}}>
              <label>Dia do mês (1-28) — use 0 para último dia do mês</label>
              <input type="number" min={0} max={31} value={monthlyDay} onChange={e=>setMonthlyDay(Number(e.target.value))} style={{marginLeft:8,width:120}} />
            </div>
          )}
        </div>

        <div style={{marginTop:12}}>
          <label>Emails (opcional)</label>
          <div style={{display:'flex',gap:8,marginTop:6}}>
            <input value={emailsInput} onChange={e=>setEmailsInput(e.target.value)} placeholder="adicionar email" style={{flex:1,padding:8}} />
            <button className="btn-gradient" onClick={addEmail} type="button">Adicionar</button>
          </div>
          <div style={{marginTop:8}}>
            {emails.map((em,i)=> (
              <div key={i} style={{display:'flex',gap:8,alignItems:'center',background:'#222a',padding:8,borderRadius:6,marginBottom:6}}>
                <span style={{flex:1}}>{em}</span>
                <button className="btn-gradient" onClick={()=>navigator.clipboard?.writeText(em)} type="button">Copiar</button>
                <button className="btn-gradient" onClick={()=>removeEmail(i)} type="button">Remover</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'flex',gap:12,marginTop:12}}>
          <button className="btn-gradient" onClick={criar}>Criar Agendamento</button>
          <button className="btn-gradient" onClick={()=>navigate(-1)}>Voltar</button>
        </div>

        <h3 style={{marginTop:18}}>Agendamentos Existentes</h3>
        {schedules.length === 0 && <div>Nenhum agendamento</div>}
        {schedules.map(s=> (
          <div key={s.id} style={{padding:8,background:'#222',marginBottom:8,borderRadius:6}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><strong>{s.nome || s.report_type}</strong> <small>({s.formato})</small></div>
              <div>
                <button className="btn-gradient" onClick={()=>fetch(`http://localhost:3000/schedules/${s.id}/run`,{method:'POST'})}>Executar Agora</button>
                <button className="btn-gradient" style={{marginLeft:8}} onClick={async ()=>{await fetch(`http://localhost:3000/schedules/${s.id}`,{method:'DELETE'}); fetchSchedules();}}>Remover</button>
              </div>
            </div>
            <div style={{marginTop:6}}>Tipo: {s.tipo_agendamento} - Cron: {s.cron_expr} {s.start_at ? `- start_at: ${s.start_at}` : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

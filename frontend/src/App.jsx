import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const StatCard = ({ title, value, colorClass }) => (
  <div className={`bg-white p-6 rounded-3xl shadow-sm border-b-4 ${colorClass} flex-1 min-w-[200px] animate-in fade-in slide-in-from-bottom-4 duration-500`}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
    <p className={`text-3xl font-black ${colorClass.replace('border-', 'text-')}`}>{value}</p>
  </div>
);

export default function App() {
  const [datosAgrupados, setDatosAgrupados] = useState([]);
  const [documentosTotales, setDocumentosTotales] = useState([]);
  const [historialReportes, setHistorialReportes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalInfo, setModalInfo] = useState(null);
  const [modalAviso, setModalAviso] = useState(false);
  const [reporteData, setReporteData] = useState({ empresa: "", notas: "" });

  useEffect(() => { cargarTodo(); }, []);

  const verificarDocumentos = async () => {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/api/verificar-documentos/",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      alert(
        `Correos enviados: ${data.correos_enviados}`
      );

    } catch (error) {

      console.error(error);

      alert("Error al verificar documentos");
    }
  };

  const cargarTodo = async () => {
    try {
      const [docs, historial] = await Promise.all([
        api.obtenerDocumentos(),
        api.obtenerHistorialReportes()
      ]);
      setDocumentosTotales(docs);
      setHistorialReportes(historial);

      const mapa = {};
      docs.forEach(doc => {
        const empresa = doc.cliente_nombre || `Cliente #${doc.cliente}`;
        if (!mapa[empresa]) mapa[empresa] = { id_cliente: doc.cliente, nombre: empresa, tramites: {} };
        const tNombre = (doc.tipo_nombre || "").toLowerCase();

        const dataDoc = { ...doc, tipo_display: doc.tipo_nombre || "Documento" };

        if (tNombre.includes('extintor') || tNombre.includes('bomber')) mapa[empresa].tramites.bomberos = dataDoc;
        else if (tNombre.includes('predial')) mapa[empresa].tramites.predial = dataDoc;
        else if (tNombre.includes('licencia')) mapa[empresa].tramites.licencia = dataDoc;
        else mapa[empresa].tramites.otro = dataDoc;
      });
      setDatosAgrupados(Object.values(mapa));
    } catch (e) { console.error("Error cargando todo:", e); }
  };

  const generarAvisoPDF = async () => {
    const doc = new jsPDF();
    const e = datosAgrupados.find(emp => emp.nombre === reporteData.empresa);
    if (!e) return;

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("AVISO DE CONTROL CENTRAL", 14, 25);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text(`Empresa: ${reporteData.empresa}`, 14, 50);
    doc.text(`Observaciones: ${reporteData.notas}`, 14, 60);

    const filas = Object.values(e.tramites).map(t => [t.tipo_display, t.estado_nombre, t.fecha_vencimiento]);
    autoTable(doc, { startY: 70, head: [['Trámite', 'Estatus', 'Vencimiento']], body: filas, headStyles: { fillColor: [79, 70, 229] } });

    try {
      await api.guardarReporte({ cliente: e.id_cliente, notas_reporte: reporteData.notas });
      await cargarTodo();
      doc.save(`Aviso_${reporteData.empresa}.pdf`);
      setModalAviso(false);
      setReporteData({ empresa: "", notas: "" });
    } catch (err) { console.error(err); }
  };

  const countV = documentosTotales.filter(d => d.semaforo_dinamico === 'verde').length;
  const countA = documentosTotales.filter(d => d.semaforo_dinamico === 'amarillo').length;
  const countR = documentosTotales.filter(d => d.semaforo_dinamico === 'rojo').length;
  const dataPie = [
    { name: 'VIGENTES', value: countV, color: '#10b981' },
    { name: 'A VENCER', value: countA, color: '#f59e0b' },
    { name: 'URGENTES', value: countR, color: '#ef4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-12 font-sans text-slate-800">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">Control Central</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] mt-2">SISTEMA DE GESTIÓN ITT</p>
        </div>
        <div className="flex gap-4">

          <button
            onClick={verificarDocumentos}
            className="bg-amber-500 text-white px-8 py-5 rounded-full font-black text-xs uppercase shadow-2xl hover:bg-amber-600 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3"
          >
            ⚠ Revisar vencimientos
          </button>

          <button
            onClick={() => setModalAviso(true)}
            className="bg-slate-900 text-white px-10 py-5 rounded-full font-black text-xs uppercase shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3"
          >
            <span className="text-lg">📝</span>
            Redactar Reporte
          </button>
        </div>
    </header>

      {/* Stats Cards */ }
  <div className="flex flex-wrap gap-6 mb-10">
    <StatCard title="Empresas" value={datosAgrupados.length} colorClass="border-slate-200" />
    <StatCard title="Documentos Vigentes" value={countV} colorClass="border-emerald-400" />
    <StatCard title="Próximos a Vencer" value={countA} colorClass="border-amber-400" />
    <StatCard title="Vencidos / Rojos" value={countR} colorClass="border-rose-400" />
  </div>

  {/* Gráfico Centrado */ }
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10 flex flex-col items-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Estado General de la Documentación</p>
        <div className="h-[280px] w-full max-w-lg">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={dataPie} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                {dataPie.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="relative mb-10">
        <input 
            type="text" 
            placeholder="Buscar empresa por nombre..." 
            className="w-full p-6 bg-white rounded-3xl shadow-sm border border-slate-100 outline-none font-bold text-sm uppercase placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-50 transition-all" 
            onChange={(e) => setBusqueda(e.target.value)} 
        />
        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl grayscale opacity-30">🔍</span>
      </div>

  {/* Tabla Principal */ }
  <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-16">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
          <th className="py-8 px-12">Empresa</th>
          <th className="py-8 px-4 text-center">Predial</th>
          <th className="py-8 px-4 text-center">Licencia</th>
          <th className="py-8 px-4 text-center">Bomberos</th>
          <th className="py-8 px-12 text-center">Otros</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {datosAgrupados.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase())).map((e, i) => (
          <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
            <td className="py-10 px-12 font-black text-slate-700 text-base uppercase italic tracking-tight">{e.nombre}</td>
            {['predial', 'licencia', 'bomberos', 'otro'].map(t => (
              <td key={t} className="py-10 px-4 text-center">
                {e.tramites[t] ? (
                  <button
                    onClick={() => setModalInfo(e.tramites[t])}
                    className={`inline-block px-5 py-2 rounded-full border text-[10px] font-black uppercase transform group-hover:scale-105 transition-all shadow-sm
                          ${e.tramites[t].semaforo_dinamico === 'verde' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                        e.tramites[t].semaforo_dinamico === 'rojo' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                          'bg-amber-50 text-amber-500 border-amber-100'}`}
                  >
                    {e.tramites[t].fecha_vencimiento || 'VER'}
                  </button>
                ) : <span className="text-slate-100 font-black">---</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Historial estilo Tarjetas (Como estaba antes) */ }
  <div className="flex flex-col gap-6 mb-20">
    <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
      <span className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm not-italic shadow-lg">H</span>
      Historial de Documentos
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {historialReportes.map((rep) => (
        <div key={rep.id_reporte} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in duration-500 group">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-black text-indigo-600 uppercase">{new Date(rep.fecha_creacion).toLocaleDateString()}</p>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black ${rep.estatus_doc === 'ELIMINADO' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
              {rep.estatus_doc || 'ACTIVO'}
            </span>
          </div>
          <p className="text-sm font-black text-slate-700 uppercase italic mb-3 group-hover:text-indigo-600 transition-colors">{rep.cliente_nombre || `Cliente #${rep.cliente}`}</p>
          <div className="bg-slate-50 p-5 rounded-2xl text-[11px] text-slate-500 italic mb-4">
            <p className="font-bold text-slate-600 mb-1">Trámite: {rep.tipo_tramite || 'General'}</p>
            "{rep.notas_reporte}"
          </div>
          <p className="text-[9px] font-black text-slate-300 uppercase text-right">Por: {rep.usuario_nombre || 'SISTEMA'}</p>
        </div>
      ))}
      {historialReportes.length === 0 && (
        <div className="col-span-full p-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500">
          <p className="text-slate-400 font-bold text-xs uppercase italic">Aún no hay actividad registrada en el historial.</p>
        </div>
      )}
    </div>
  </div>

  {/* Modal Detalles */ }
  {
    modalInfo && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className={`p-10 text-white font-black uppercase italic text-2xl ${modalInfo.semaforo_dinamico === 'rojo' ? 'bg-rose-500' : modalInfo.semaforo_dinamico === 'verde' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
            {modalInfo.tipo_display}
          </div>
          <div className="p-10 space-y-6">
            <div className="bg-slate-50 p-8 rounded-[2rem]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Estado del Trámite</p>
              <p className="font-black text-xl text-slate-800 italic uppercase">{modalInfo.estado_nombre}</p>
              <div className="h-[2px] w-12 bg-slate-200 my-4"></div>
              <p className="font-black text-rose-600 text-sm">Vencimiento: {modalInfo.fecha_vencimiento || '---'}</p>
            </div>
            {modalInfo.archivo && (
              <button
                onClick={() => {
                  let urlFinal = modalInfo.archivo;
                  if (!urlFinal.startsWith('http')) {
                    const base = "http://localhost:8000";
                    urlFinal = urlFinal.startsWith('/') ? `${base}${urlFinal}` : `${base}/${urlFinal}`;
                  }
                  window.open(urlFinal, '_blank');
                }}
                className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                👁️ Ver Documento PDF
              </button>
            )}
            <button onClick={() => setModalInfo(null)} className="w-full text-slate-300 font-black text-[10px] uppercase tracking-widest hover:text-slate-500 transition-colors">Cerrar Ventana</button>
          </div>
        </div>
      </div>
    )
  }

  {/* Modal Redactar Reporte */ }
  {
    modalAviso && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-10 bg-indigo-600 text-white font-black uppercase italic text-2xl">Redactar Reporte</div>
          <div className="p-10 space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Seleccionar Cliente</label>
              <select className="w-full p-5 bg-slate-50 rounded-[1.5rem] border-none font-bold outline-none text-slate-700" onChange={(e) => setReporteData({ ...reporteData, empresa: e.target.value })}>
                <option value="">Lista de empresas...</option>
                {datosAgrupados.map((e, i) => <option key={i} value={e.nombre}>{e.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Notas e Instrucciones</label>
              <textarea rows="4" className="w-full p-5 bg-slate-50 rounded-[1.5rem] border-none font-bold outline-none text-slate-700 placeholder:italic" placeholder="Ej: Se requiere renovar el dictamen eléctrico..." onChange={(e) => setReporteData({ ...reporteData, notas: e.target.value })}></textarea>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={generarAvisoPDF} disabled={!reporteData.empresa || !reporteData.notas} className="flex-1 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase shadow-xl disabled:opacity-30 disabled:grayscale transition-all">Generar y Descargar PDF</button>
              <button onClick={() => setModalAviso(false)} className="px-6 text-slate-300 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
    </div >
  );
}
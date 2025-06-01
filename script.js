// Funções auxiliares
function getDiaSemana(dataStr) {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const date = new Date(dataStr + 'T00:00:00');
  return dias[date.getDay()];
}
function isValidaData(dataStr) {
  const dia = new Date(dataStr + 'T00:00:00').getDay();
  // aceitar só segunda(1) a sábado(6)
  return dia >= 1 && dia <= 6;
}

let entregas = JSON.parse(localStorage.getItem('entregas')) || [];

const empresas = ['door', 'anjun', 'logan', 'remedio'];

const form = document.getElementById('formEntrega');
form.data.min = '2025-01-01';
form.data.max = '2030-12-31';

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = form.data.value;
  if (!isValidaData(data)) {
    alert('Por favor, escolha uma data de segunda a sábado.');
    return;
  }

  const idx = entregas.findIndex(e => e.data === data);
  const novaEntrada = {
    data,
    door: Number(form.door.value),
    anjun: Number(form.anjun.value),
    logan: Number(form.logan.value),
    remedio: Number(form.remedio.value),
    insucesso: Number(form.insucesso.value),
    cep: Number(form.cep.value),
    naoLocalizado: Number(form.naoLocalizado.value),
    mudouSe: Number(form.mudouSe.value)
  };

  if (idx >= 0) {
    entregas[idx] = novaEntrada;
  } else {
    entregas.push(novaEntrada);
  }
  entregas.sort((a,b) => a.data.localeCompare(b.data));
  localStorage.setItem('entregas', JSON.stringify(entregas));
  form.reset();
  form.data.value = data;
  atualizarResumo();
  atualizarGraficos();
});

function atualizarResumo() {
  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const tbody = document.querySelector('#tableResumo tbody');
  tbody.innerHTML = '';

  // Dados para cada empresa por dia da semana
  const resumo = {};
  empresas.forEach(emp => resumo[emp] = Array(6).fill(0));

  entregas.forEach(ent => {
    const dia = new Date(ent.data + 'T00:00:00').getDay();
    if (dia >= 1 && dia <= 6) {
      empresas.forEach(emp => {
        resumo[emp][dia-1] += ent[emp];
      });
    }
  });

  empresas.forEach(emp => {
    const tr = document.createElement('tr');
    const nomeEmp = emp.charAt(0).toUpperCase() + emp.slice(1);
    tr.innerHTML = `<td>${nomeEmp}</td>` +
      resumo[emp].map(v => `<td>${v}</td>`).join('') +
      `<td>${resumo[emp].reduce((a,b) => a+b,0)}</td>`;
    tbody.appendChild(tr);
  });
}

let barChart, pieChart, insucessoBarChart, insucessoPieChart;

function atualizarGraficos() {
  // Dados para gráficos sucesso (somar door, anjun, logan, remedio)
  const totalSucessoPorEmpresa = {door:0, anjun:0, logan:0, remedio:0};
  let totalInsucesso = 0;
  let totalCep = 0;
  let totalNaoLocalizado = 0;
  let totalMudouSe = 0;

  entregas.forEach(ent => {
    empresas.forEach(emp => totalSucessoPorEmpresa[emp] += ent[emp]);
    totalInsucesso += ent.insucesso;
    totalCep += ent.cep;
    totalNaoLocalizado += ent.naoLocalizado;
    totalMudouSe += ent.mudouSe;
  });

  // Gráfico barra sucesso
  if (barChart) barChart.destroy();
  barChart = new Chart(document.getElementById('barChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Door', 'Anjun', 'Logan', 'Remédio'],
      datasets: [{
        label: 'Entregas com Sucesso',
        data: [totalSucessoPorEmpresa.door, totalSucessoPorEmpresa.anjun, totalSucessoPorEmpresa.logan, totalSucessoPorEmpresa.remedio],
        backgroundColor: ['#ff9a9e','#fad0c4','#a18cd1','#fbc2eb']
      }]
    },
    options: {
      responsive:true,
      plugins: {legend:{display:false}}
    }
  });

  // Gráfico pizza sucesso
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(document.getElementById('pieChart').getContext('2d'), {
    type: 'pie',
    data: {
      labels: ['Door', 'Anjun', 'Logan', 'Remédio'],
      datasets: [{
        data: [totalSucessoPorEmpresa.door, totalSucessoPorEmpresa.anjun, totalSucessoPorEmpresa.logan, totalSucessoPorEmpresa.remedio],
        backgroundColor: ['#ff9a9e','#fad0c4','#a18cd1','#fbc2eb']
      }]
    },
    options: {
      responsive:true
    }
  });

  // Gráfico barra insucesso
  if (insucessoBarChart) insucessoBarChart.destroy();
  insucessoBarChart = new Chart(document.getElementById('insucessoBarChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Total Insucesso', 'CEP Inválido', 'Não Localizado', 'Mudou-se'],
      datasets: [{
        label: 'Insucessos',
        data: [totalInsucesso, totalCep, totalNaoLocalizado, totalMudouSe],
        backgroundColor: ['#a18cd1','#fbc2eb','#ff9a9e','#fad0c4']
      }]
    },
    options: {
      responsive:true,
      plugins: {legend:{display:false}}
    }
  });

  // Gráfico pizza insucesso
  if (insucessoPieChart) insucessoPieChart.destroy();
  insucessoPieChart = new Chart(document.getElementById('insucessoPieChart').getContext('2d'), {
    type: 'pie',
    data: {
      labels: ['Total Insucesso', 'CEP Inválido', 'Não Localizado', 'Mudou-se'],
      datasets: [{
        data: [totalInsucesso, totalCep, totalNaoLocalizado, totalMudouSe],
        backgroundColor: ['#a18cd1','#fbc2eb','#ff9a9e','#fad0c4']
      }]
    },
    options: {
      responsive:true
    }
  });
}

function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Resumo Semanal Entregas Bike', 14, 20);

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const startX = 14;
  let startY = 30;

  doc.setFontSize(12);

  // Cabeçalho tabela
  doc.text('Empresa', startX, startY);
  diasSemana.forEach((d,i) => {
    doc.text(d, startX + 30 + i*20, startY);
  });
  doc.text('Total', startX + 30 + 6*20, startY);

  startY += 8;

  // Dados tabela
  const resumo = {};
  empresas.forEach(emp => resumo[emp] = Array(6).fill(0));
  entregas.forEach(ent => {
    const dia = new Date(ent.data + 'T00:00:00').getDay();
    if (dia >= 1 && dia <= 6) {
      empresas.forEach(emp => {
        resumo[emp][dia-1] += ent[emp];
      });
    }
  });

  empresas.forEach(emp => {
    const nomeEmp = emp.charAt(0).toUpperCase() + emp.slice(1);
    doc.text(nomeEmp, startX, startY);
    resumo[emp].forEach((v,i) => {
      doc.text(v.toString(), startX + 30 + i*20, startY);
    });
    const total = resumo[emp].reduce((a,b) => a+b,0);
    doc.text(total.toString(), startX + 30 + 6*20, startY);
    startY += 8;
  });

  doc.save('resumo_entregas_bike.pdf');
}

// Inicialização
atualizarResumo();
atualizarGraficos();

// Botão gerar PDF
document.getElementById('btnPdf').addEventListener('click', gerarPDF);

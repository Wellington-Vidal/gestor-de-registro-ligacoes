/*
The MIT License

Copyright (c) 2024 Wellington Vidal

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

This project includes code from:

* **qrcode.min.js:** Copyright (c) 2020 datalog.
  Licensed under MIT License.
  Link: https://github.com/datalog/qrcode-svg
*/

let db;
const nomeBanco = "db_grl";
const tabelaRegistroLigacoes = "tbl_registro_ligacoes";

function CriaBancoDeDados()
{
    if (!window.indexedDB) {
        alert("Seu navegador não suporta IndexedDB");
    }
    else
    {
        var request = window.indexedDB.open(nomeBanco, 1);

        request.onerror = (event) => {
            console.error(`Database error: ${event.target.errorCode}`);
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
        
            ListaRegistrosLigacoes();
        };
    
        request.onupgradeneeded = (event) => {
            db = event.target.result;
        
            const objectStore = db.createObjectStore(tabelaRegistroLigacoes, { keyPath: "id", autoIncrement: true });
            objectStore.createIndex("data", "data", { unique: false });
            objectStore.createIndex("proposito", "proposito", { unique: false });
            objectStore.createIndex("origem", "origem", { unique: false });
            objectStore.createIndex("destino", "destino", { unique: false });
            objectStore.createIndex("cliente", "cliente", { unique: false });
            objectStore.createIndex("telefones", "telefones", { unique: false });
            objectStore.createIndex("situacao", "situacao", { unique: false });
        }
    }
}

CriaBancoDeDados();

function CadastraRegistroLigacoes()
{
    let txtData = document.getElementById('txtData');
    let txtProposito = document.getElementById('txtProposito');
    let txtOrigem = document.getElementById('txtOrigem');
    let txtDestino = document.getElementById('txtDestino');
    let txtCliente = document.getElementById('txtCliente');
    let selTelefones = document.getElementById('selTelefones');

    if (selTelefones.length > 0)
    {
        let telefones = '';

        for (let t = 0 ; t < selTelefones.length ; t++)
        {
            if (telefones != '')
            {
                telefones = telefones + ' / ';
            }

            telefones = telefones + selTelefones.options[t].value;
        }

        document.getElementById('trZero').style.display = "none";
        let dataFormatada = PegaDataHojeFormatada();
    
        //indexedDB
        const transaction = db.transaction([tabelaRegistroLigacoes], "readwrite");
        const objectStore = transaction.objectStore(tabelaRegistroLigacoes);
    
        const novoRegistro = {
            data: txtData.value,
            proposito: txtProposito.value,
            origem: txtOrigem.value,
            destino: txtDestino.value, 
            cliente: txtCliente.value, 
            telefones: telefones, 
            situacao: "Pendente"
        }
    
        const request = objectStore.add(novoRegistro);
    
        transaction.oncomplete = (event) => {
            console.log("oncomplete", event);
            alert("Registro Cadastrado com Sucesso!");
    
            ListaRegistrosLigacoes();
            FiltraDados();
        };
        
        transaction.onerror = (event) => {
            console.log("onerror", event);
        };
    }
    else
    {
        alert('Nenhum telefone foi adicionado!');
    }
}

function ListaRegistrosLigacoes()
{
    LimpaTabela();
    LimpaItensDataList('histPropositos');
    LimpaItensDataList('histOrigens');
    LimpaItensDataList('histDestinos');

    let tabela = document.getElementById('tabela');
    document.getElementById('trZero').style.display = "none";

    const transaction = db.transaction([tabelaRegistroLigacoes], "readonly");
    const objectStore = transaction.objectStore(tabelaRegistroLigacoes);
    let qtdRegistros = 0;
    let listaDataListProposito = [];
    let listaDataListOrigem = [];
    let listaDataListDestino = [];

    objectStore.openCursor().onsuccess = function(event){
        var cursor = event.target.result;

        if (cursor)
        {
            let id = cursor.value.id;
            let situacao = cursor.value.situacao;

            let colunas = [
                `<input type="checkbox" id='CHK${id}'/>`,
                cursor.value.id, 
                cursor.value.data,
                cursor.value.proposito,
                cursor.value.origem,
                cursor.value.destino,
                cursor.value.cliente,
                cursor.value.telefones,
                cursor.value.situacao,
                `<button type='button' onclick=\"AbreMenuAcoes(this, '${id}', '${situacao}')\" class='btnQrCode'>?</button>`,
            ];

            //`<button type='button' onclick=\"GeraQrCode('${id}')\" class='btnQrCode'>Qr</button>`

            let novaLinha = tabela.insertRow();

            for (let i = 0 ; i < colunas.length ; i++)
            {
                let col = novaLinha.insertCell(i);
                col.innerHTML = colunas[i];

                if (i == 3)
                {                    
                    //col.innerHTML = colunas[i].replace(/[,]/g, ",\n");
                }
            }

            qtdRegistros++;

            //ADICIONA ITENS AO DATALIST (HISTÓRICO DE PROPOSITO)
            let proposito = cursor.value.proposito.trim();

            if (listaDataListProposito.indexOf(proposito) == -1)
            {
                listaDataListProposito.push(proposito);
                AdicionaItemDataList(proposito, 'histPropositos');
            }

            //ADICIONA ITENS AO DATALIST (HISTÓRICO DE ORIGEM)
            let origem = cursor.value.origem.trim();

            if (listaDataListOrigem.indexOf(origem) == -1)
            {
                listaDataListOrigem.push(origem);
                AdicionaItemDataList(origem, 'histOrigens');
            }

            //ADICIONA ITENS AO DATALIST (HISTÓRICO DE DESTINOS)
            let destino = cursor.value.destino.trim();

            if (listaDataListDestino.indexOf(destino) == -1)
            {
                listaDataListDestino.push(destino);
                AdicionaItemDataList(destino, 'histDestinos');
            }

            cursor.continue();
        }

        if (qtdRegistros == 0)
        {
            document.getElementById('trZero').style.display = "";
        }
        else
        {
            FiltraDados();
        }
    }
}

function LimpaTabela()
{
    try 
    {
        let tabela = document.getElementById('tabela');
        let trs = tabela.getElementsByTagName('tr');

        if (trs.length > 3)
        {
            for (let i = trs.length - 1 ; i > 2 ; i--)
            {
                tabela.deleteRow(i);
            }
        }
    } 
    catch (error) 
    {
        console.log(error);
    }
}

function GeraQrCode(dadosQrCode)
{
    try
    {
        let qrCode = new QRCode({msg: dadosQrCode, ecl:'L'});
        
        let btnFecharQr = document.createElement('button');
        btnFecharQr.innerHTML = "X";
        btnFecharQr.setAttribute('style', "background-color: #ff0000; color: #ffffff; float: right;");
        btnFecharQr.addEventListener('click', FechaJanelaQr);
    
        if (document.getElementById('divJanelaQrCode'))
        {        
            FechaJanelaQr();
        }
        
        let div = document.createElement('div');
        div.setAttribute('id', 'divJanelaQrCode');
        div.setAttribute('style', "background-color: #ffffff; position: fixed; width: 300px; height: 250px; top: 50%; left: 50%; text-align: center; border: 1px solid black;");
        div.appendChild(btnFecharQr);
        div.appendChild(qrCode);
    
        document.body.append(div);
    }
    catch (error) 
    {
        alert('Erro ao ler protocolo!');
    }
}

function FechaJanelaQr()
{
    try {
        let divJanelaQrCode = document.getElementById('divJanelaQrCode');
        document.body.removeChild(divJanelaQrCode);    
    } catch (error) {
        console.log('Erro ao apagar elemento!');   
    }
}

function PegaDataHojeFormatada()
{
    const dataHoje = new Date();
    let dia = dataHoje.getDate() < 10 ? '0' + dataHoje.getDate() : dataHoje.getDate();
    let mes = dataHoje.getMonth() + 1 < 10 ? '0' + (dataHoje.getMonth() * 1 + 1) : dataHoje.getMonth() + 1;
    let ano = dataHoje.getFullYear();
    
    return dia + "/" + mes + "/" + ano;
}

function SelecionaAba(aba)
{
    let abaCadastro = document.getElementById('aba-cadastro');
    let abaConfiguracao = document.getElementById('aba-configuracao');
    let formCadastro = document.getElementById('form-cadastro');
    let formConfiguracao = document.getElementById('form-configuracao');

    if (abaCadastro == aba)
    {
        abaCadastro.setAttribute('style', "border-bottom: 1px solid #dcdcdc");
        abaConfiguracao.setAttribute('style', "border-bottom: 1px solid grey");
        formCadastro.style.display = "block";
        formConfiguracao.style.display = "none";
    }
    else if (abaConfiguracao == aba)
    {
        abaConfiguracao.setAttribute('style', "border-bottom: 1px solid #dcdcdc");
        abaCadastro.setAttribute('style', "border-bottom: 1px solid grey");
        formConfiguracao.style.display = "block";
        formCadastro.style.display = "none";
    }
}

function ValidaCampoRede(tipo, campo)
{
    let validado = false;

    if ((tipo == 'PORTA') && (!Number.isNaN(campo)))
    {
        validado = true;
    }
    else if ((tipo == 'IP') && (campo.split(".").length == 4))
    {
        validado = true;
    }

    return validado;
}

function FormataCampo(tipo, campo)
{
    if (tipo == 'IP')
    {
        campo.value = campo.value.replace(/[^0-9|.]/g, '');
    }
    else if (tipo == 'PORTA')
    {
        campo.value = campo.value.replace(/[^0-9]/g, '');
    }
    else if (tipo == 'ORIGEM')
    {        
        campo.value = campo.value.toUpperCase();
    }
    else if (tipo == 'DESTINO')
    {
        campo.value = campo.value.toUpperCase();
    }
    else if (tipo == 'CLIENTE')
    {
        campo.value = campo.value.toUpperCase();
    }
    else if (tipo == 'DATA')
    {        
        campo.value = campo.value.replace(/[^0-9|\/|-]/g, '');
    }
    else if (tipo == 'TELEFONE')
    {
        campo.value = campo.value.replace(/[^0-9|-]/g, '');
    }
    else if (tipo == 'PROPOSITO')
    {        
        campo.value = campo.value.toUpperCase();
    }

    campo.value = campo.value.replace("|", ''); //SEPARADOR DE CAMPOS
    campo.value = campo.value.replace("/", '-'); //SEPARADOR DE TELEFONES
    campo.value = campo.value.replace(";", ''); //SEPARADOR DE REGISTROS
}

function LimpaItensDataList(idDataList)
{
    try 
    {
        let dataList = document.getElementById(idDataList);
    
        for (let i = dataList.options.length - 1 ; i >= 0 ; i--)
        {
            dataList.children[i].remove();
        }
    } 
    catch (error) {
        console.log(error);   
    }
}

function AdicionaItemDataList(novoItem, idDataList)
{
    try 
    {
        let dataList = document.getElementById(idDataList);
        let op = document.createElement('option');
        op.setAttribute('value', novoItem);
        dataList.append(op);    
    } 
    catch (error) 
    {
        console.log(error);   
    }
}

function FiltraDados()
{
    let txtFiltroNum = document.getElementById('txtFiltroNum');
    let txtFiltroData = document.getElementById('txtFiltroData');
    let txtFiltroProposito = document.getElementById('txtFiltroProposito');
    let txtFiltroOrigem = document.getElementById('txtFiltroOrigem');
    let txtFiltroDestino = document.getElementById('txtFiltroDestino');
    let txtFiltroCliente = document.getElementById('txtFiltroCliente');
    let txtFiltroTelefones = document.getElementById('txtFiltroTelefones');
    let selFiltroSituacao = document.getElementById('selFiltroSituacao');
    
    let tabela = document.getElementById('tabela');
    let trs = tabela.getElementsByTagName('tr');

    let valoresCampos = [null, 
                         txtFiltroNum.value, 
                         txtFiltroData.value,
                         txtFiltroProposito.value,
                         txtFiltroOrigem.value,
                         txtFiltroDestino.value, 
                         txtFiltroCliente.value, 
                         txtFiltroTelefones.value, 
                         selFiltroSituacao.value];

    const totalCamposBusca = valoresCampos.length - 1;

    for (let i = 3 ; i < trs.length ; i++)
    {
        let tds = trs[i].getElementsByTagName('td');
        let localizou = 0;

        for (let c = 1 ; c < valoresCampos.length ; c++)
        {
            if (tds[c])
            {
                if ((valoresCampos[c] == '') || (tds[c].innerHTML.indexOf(valoresCampos[c]) > -1))
                {
                    localizou++;
                }
            }
        }

        if (totalCamposBusca == localizou)
        {
            trs[i].style.display = '';
        }
        else
        {
            trs[i].style.display = 'none';
        }
    }
}

function AbreMenuAcoes(btn, idProtocolo, situacao)
{
    let linha = btn.parentElement.parentElement;

    let divId = document.createElement('div');
    divId.innerHTML = "Protocolo: " + idProtocolo;

    let textoBtnConfirmar = "Confirma Entrega";

    if (situacao == 'Entregue')
    {
        textoBtnConfirmar = "Retornar Situação";
    }

    let divBtn1 = document.createElement('div');
    let btnConfirmar = document.createElement('button');
    btnConfirmar.innerHTML = textoBtnConfirmar;
    btnConfirmar.setAttribute('style', "width: 100%; margin-bottom: 5px; background-color: #007700; color: #ffffff;");
    btnConfirmar.addEventListener('click', function(){ConfirmaEntrega(Number(idProtocolo), 'divJanelaMenuOpcoes', situacao)});
    divBtn1.appendChild(btnConfirmar);

    let divBtn2 = document.createElement('div');
    let btnExcluir = document.createElement('button');
    btnExcluir.innerHTML = "Excluir Protocolo";
    btnExcluir.setAttribute('style', "width: 100%; background-color: #770000; color: #ffffff;");
    btnExcluir.addEventListener('click', function(){ExcluiProtocolo(Number(idProtocolo), 'divJanelaMenuOpcoes')});
    divBtn2.appendChild(btnExcluir);

    let divBotoes = document.createElement('div');
    divBotoes.setAttribute('style', "text-align: left; padding: 5px; width: 90%; float: left;");
    divBotoes.appendChild(divBtn1);
    divBotoes.appendChild(divBtn2);

    let divBtnFechar = document.createElement('div');
    divBtnFechar.setAttribute('style', "width: 10%; float: left;");
    let btnFecharMenuOpcoes = document.createElement('button');
    btnFecharMenuOpcoes.innerHTML = "X";
    btnFecharMenuOpcoes.setAttribute('style', "background-color: #ff0000; color: #ffffff; float: right;");
    btnFecharMenuOpcoes.addEventListener('click', function(){FechaJanela('divJanelaMenuOpcoes')});
    divBtnFechar.appendChild(btnFecharMenuOpcoes);

    if (document.getElementById('divJanelaMenuOpcoes'))
    {        
        FechaJanela('divJanelaMenuOpcoes');
    }
    
    let div = document.createElement('div');
    div.setAttribute('id', 'divJanelaMenuOpcoes');
    div.setAttribute('style', "background-color: #ffffff; position: absolute; width: 300px; height: 120px; top: 50%; right: 15%; text-align: center; border: 1px solid black;");
    div.appendChild(divId);
    div.appendChild(divBotoes);
    div.appendChild(divBtnFechar);

    document.body.append(div);
}

function FechaJanela(id)
{
    try {
        let divJanela = document.getElementById(id);
        document.body.removeChild(divJanela);    
    } catch (error) {
        console.log('Erro ao apagar elemento! ' + error);
    }
}

function ConfirmaEntrega(idProtocolo, idJanela, situacao)
{
    try 
    {
        FechaJanela(idJanela);

        let nome = "";
        let retornar = false;

        if (situacao == 'Pendente')
        {
            nome = prompt("Informe a quem foi entregue o protocolo de Nº: " + idProtocolo);
        }
        else
        {
            retornar = confirm('Deseja retornar o protocolo de Nº: ' + idProtocolo);
        }

        if ((situacao == 'Pendente') && ((nome == null) || (nome == "")))
        {
            alert('Entrega não confirmada!');
        }
        else if ((situacao == 'Entregue') && (!retornar))
        {
            alert('Protocolo não retornado!');
        }
        else 
        {
            let dataFormatada = PegaDataHojeFormatada();

            //indexedDB
            const transaction = db.transaction([tabelaRegistroLigacoes], "readwrite");
            const objectStore = transaction.objectStore(tabelaRegistroLigacoes);

            const request = objectStore.get(idProtocolo);

            request.onerror = (event) => {
                alert('Protocolo não encontrado!');
            };

            request.onsuccess = (event) => {
                const protocolo = event.target.result;
                let msgResposta = '';

                if (situacao == 'Pendente')
                {
                    protocolo.data_recebeu = dataFormatada;
                    protocolo.quem_recebeu = nome;
                    protocolo.situacao = 'Entregue';
                    msgResposta = 'Entrega Realizada!';
                }
                else if (situacao == 'Entregue')
                {
                    protocolo.data_recebeu = '---';
                    protocolo.quem_recebeu = '---';
                    protocolo.situacao = 'Pendente';
                    msgResposta = 'Entrega Retornada!';
                }

                const requestUpdate = objectStore.put(protocolo);

                requestUpdate.onerror = (event) => {
                    alert('Erro ao confirmar entrega!');
                };

                requestUpdate.onsuccess = (event) => {
                    alert(msgResposta);

                    ListaRegistrosLigacoes();
                    FiltraDados();
                };
            };
        }
    } 
    catch (error) 
    {
        alert('Erro ao confirmar entrega!');
    }
}

function ExcluiProtocolo(idProtocolo, idJanela)
{
    try
    {
        FechaJanela(idJanela);

        if (confirm('Deseja excluir o protocolo de Nº: ' + idProtocolo))
        {
            //indexedDB
            const transaction = db.transaction([tabelaRegistroLigacoes], "readwrite");
            const objectStore = transaction.objectStore(tabelaRegistroLigacoes);

            const request = objectStore.delete(idProtocolo);

            request.onsuccess = (event) => {
                alert('Protocolo Excluído com Sucesso!');

                ListaRegistrosLigacoes();
                FiltraDados();
            };
        }
        else
        {
            alert('Protocolo Não Excluído!');
        }
    }
    catch (error)
    {
        alert('Erro ao excluir protocolo!');
    }
}

function AdicionaTelefone()
{
    try 
    {
        let selDdd = document.getElementById('selDdd');
        let txtTelefone = document.getElementById('txtTelefone');
        let selTelefones = document.getElementById('selTelefones');

        let telefone = selDdd.value + txtTelefone.value;

        if ((telefone.length >= 10) && (telefone.length <= 12))
        {
            let op = document.createElement('option');
            op.setAttribute('value', telefone);
            op.textContent = telefone;
            selTelefones.append(op);
        }
    }
    catch (error) 
    {
        alert('Erro ao adicionar telefone!');
    }
}

function Limpar()
{
    try
    {
        document.getElementById('txtData').value = '';
        document.getElementById('txtProposito').value = '';
        document.getElementById('txtOrigem').value = '';
        document.getElementById('txtDestino').value = '';
        document.getElementById('txtCliente').value = '';
        document.getElementById('selDdd').value = '11';
        document.getElementById('txtTelefone').value = '';
        document.getElementById('selTelefones').innerHTML = '';
    }
    catch (error)
    {
        console.log(error);
    }
}

function GerarQrCodeSelecao()
{
    try
    {
        let tabela = document.getElementById('tabela');
        let trs = tabela.getElementsByTagName('tr');
        let listaIdsSelecionados = [];
        
        //ADICIONA IDs SELECIONADOS
        for (let i = 2 ; i < trs.length ; i++)
        {
            let tds = trs[i].getElementsByTagName('td');

            if ((tds[0]) && (tds[0].getElementsByTagName('input').length > 0))
            {
                let listaInputs = tds[0].getElementsByTagName('input');

                if ((listaInputs[0].getAttribute('type') == 'checkbox') && (listaInputs[0].checked))
                {
                    listaIdsSelecionados.push(tds[1].innerHTML * 1);
                }
            }
        }

        //BUSCA NO BANCO DE DADOS E FILTRA OS IDs SELECIONADOS
        if (listaIdsSelecionados.length > 0)
        {
            const transaction = db.transaction([tabelaRegistroLigacoes], "readonly");
            const objectStore = transaction.objectStore(tabelaRegistroLigacoes);
            let dadosQrCode = "";

            objectStore.openCursor().onsuccess = function(event){
                var cursor = event.target.result;
        
                if (cursor)
                {
                    if (listaIdsSelecionados.indexOf(cursor.value.id * 1) > -1)
                    {
                        if (dadosQrCode != '')
                        {
                            dadosQrCode = dadosQrCode + ';';
                        }

                        dadosQrCode = dadosQrCode + `id:${cursor.value.id}|data:${cursor.value.data}|proposito:${cursor.value.proposito}|origem:${cursor.value.origem}|destino:${cursor.value.destino}|cliente:${cursor.value.cliente}|telefones:${cursor.value.telefones}|situacao:${cursor.value.situacao}`;
                    }

                    cursor.continue();
                }

                if (dadosQrCode.length <= 4000)
                {
                    GeraQrCode(dadosQrCode);
                }
            }
        }
    }
    catch (error)
    {
        console.log(error);
    }
}

function SelecionaTodos()
{
    try 
    {
        let chkTodos = document.getElementById('chkTodos');
        let listaInputs = document.getElementsByTagName('input');
        
        for (let c = 0 ; c < listaInputs.length ; c++)
        {
            if (listaInputs[c].getAttribute('type') == 'checkbox')
            {
                listaInputs[c].checked = chkTodos.checked;
            }
        }
    } 
    catch (error) 
    {
        alert('Erro ao selecionar!');        
    }

}
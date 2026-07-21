---
title: Manual do CRC-Jud
description: Passo a passo para login e solicitação de 2ª via de certidões via CRC-Jud.
sidebar:
  order: 2
---

A **CRC-Jud (Central de Informações do Registro Civil)** é a plataforma utilizada para localização de registros e solicitação de certidões de nascimento, casamento e óbito para instrução de procedimentos assistenciais e judiciais.

---

## 📋 Pré-requisitos & Acesso

* **Link Oficial:** [https://registrocivil.org.br](https://registrocivil.org.br) / Portal CRC-Jud
* **Requisitos:** Certificado Digital (e-CPF / Token) ou Credenciais Institucionais autorizadas.
* **Navegador Recomendado:** Google Chrome ou Microsoft Edge em versão atualizada.

---

## 🔑 Passo 1: Login no Sistema

1. Acesse o portal oficial da **CRC-Jud**.
2. Na tela inicial, clique no botão **"Entrar com Certificado Digital"** ou digite seu CPF e Senha cadastrados.
3. Se utilizar **Certificado Digital**:
   * Insira o Token USB / Cartão no computador.
   * Selecione o certificado correspondente e digite o código PIN.
4. Verifique se o perfil exibido no canto superior direito é o da **Defensoria Pública / Itinerante**.

:::caution[Atenção com a Validade do Certificado]
Se o sistema apresentar erro de autenticação ou token não reconhecido, verifique se a extensão do emissor do certificado (ex: Web PKI / SafeSign) está instalada e ativa no navegador.
:::

---

## 📜 Passo 2: Solicitar Via de Certidão

Para solicitar uma 2ª via de certidão de nascimento, casamento ou óbito:

1. No menu principal, navegue até **Pedidos > Nova Solicitação de Certidão**.
2. **Identificação da Parte / Assistido:**
   * Preencha o CPF ou nome completo do registrado.
   * Informe o nome da mãe e data de nascimento (se disponíveis para refinar a busca).
3. **Dados do Cartório (Se conhecidos):**
   * Selecione o **Estado (UF)** e o **Município**.
   * Informe o **CNS (Código Nacional de Serventia)** ou nome do Cartório de Registro Civil.
   * Insira os dados do livro, folha e termo (se constarem na documentação prévia).
4. **Tipo de Certidão:**
   * Selecione a opção desejada: *Nascimento*, *Casamento* ou *Óbito*.
   * Escolha o formato de expedição (*Certidão Eletrônica / PDF* ou *Física em Papel*).
5. **Justificativa e Gratuidade:**
   * Marque a opção de **Isenção / Assistência Judiciária Gratuita** conforme convênio ou requisição defensorial.
   * Anexe o Termo de Hipossuficiência ou Requisição Oficial em formato PDF.
6. Clique em **Enviar Pedido**.

---

## 🔍 Passo 3: Acompanhamento de Pedidos

1. Para acompanhar a resposta dos cartórios, acesse **Pedidos > Meus Pedidos**.
2. Acompanhe o status da solicitação:
   * 🟡 **Pendente:** Aguardando análise do cartório.
   * 🟢 **Concluído / Disponível:** A certidão eletrônica está disponível para download.
   * 🔴 **Exigência / Recusado:** O cartório solicitou complementação de dados.
3. Após a liberação, faça o download do arquivo PDF assinado digitalmente e adicione-o ao prontuário do assistido no **SOLAR**.

---

## ❓ Solução de Problemas Frequentes

* **Cartório não localiza o registro:** Certifique-se de realizar antes uma busca ampla na opção *Busca de Registro Civil* informando variações do nome do assistido ou dos genitores.
* **Erro de carregamento no envio de anexos:** Certifique-se de que os arquivos estejam no formato `.pdf` e não ultrapassem o limite de 5MB por anexo.

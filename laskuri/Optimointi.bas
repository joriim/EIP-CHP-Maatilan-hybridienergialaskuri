Attribute VB_Name = "Module1"
Option Explicit

' Maatilan hybridienergialaskuri 0.9.2 - kokoonpanon optimointi
' Koordinaattihaku: yksi teknologia kerrallaan, muut pidetään paikallaan.
' Tekijät: Suvi Karirinne, Miiro Jääskeläinen (SEAMK, Maatalous ja energia -tutkimusryhmä). Lisenssi: MIT (LICENSE-CODE).
'
' Muutokset 0.9.2-luonnokseen:
' - laskenta pakotetaan valmiiksi jokaisen kokoonpanon jälkeen (CalculationState)
' - ensimmäinen arvio tehdään täydellä uudelleenlaskennalla (CalculateFull)
' - virhe, Esc-keskeytys tai liian pitkä loki palauttaa alkuperäisen kokoonpanon
' - tyhjä ehdokaslista ei kaada hakua
' - varoitus, jos kaikki lasketut tulokset ovat samat (laskenta ei päivittynyt)

Private Const NV As Long = 6
Private Const LOG0 As Long = 25
Private Const LOGMAX As Long = 401

Sub AjaOptimointi()
    Dim wsO As Worksheet, wsD As Worksheet
    Set wsO = ThisWorkbook.Worksheets("Optimointi")
    Set wsD = ThisWorkbook.Worksheets("Ohjauspaneeli ja Tulokset")

    Dim dashRow As Variant: dashRow = Array(9, 10, 11, 12, 13, 15)   ' PV, LP, kattila, varaaja, BESS, CHP
    Dim metric As String: metric = CStr(wsO.Range("C5").Value)
    Dim lists(1 To NV) As Variant, origC(1 To NV) As Variant, origD(1 To NV) As Variant
    Dim cfg(1 To NV) As Double
    Dim i As Long, j As Long, n As Long, t() As String, arr() As Double

    For i = 1 To NV
        t = Split(CStr(wsO.Cells(7 + i, "D").Value), ",")
        n = 0
        If UBound(t) >= 0 Then
            ReDim arr(0 To UBound(t))
            For j = 0 To UBound(t)
                If Trim(t(j)) <> "" Then arr(n) = Val(Trim(t(j))): n = n + 1
            Next j
        End If
        origC(i) = wsD.Cells(dashRow(i - 1), "C").Value
        origD(i) = wsD.Cells(dashRow(i - 1), "D").Value
        If origC(i) = 1 Then cfg(i) = CDbl(origD(i)) Else cfg(i) = 0
        If n = 0 Then
            ReDim arr(0 To 0): arr(0) = cfg(i)       ' tyhjä lista: pidä nykyinen arvo
        Else
            ReDim Preserve arr(0 To n - 1)
        End If
        lists(i) = arr
    Next i

    If MsgBox("Haku laskee laskurin uudelleen jokaiselle kokoonpanolle. " & _
              "Tämä voi kestää minuutteja tai tunteja." & vbCrLf & vbCrLf & _
              "Mittari: " & metric & vbCrLf & _
              "Keskeytys: Esc (alkuperäinen kokoonpano palautetaan)." & vbCrLf & vbCrLf & _
              "Aloitetaanko?", vbOKCancel + vbQuestion, "Kokoonpanon optimointi") <> vbOK Then Exit Sub

    Dim oldCalc As Long: oldCalc = Application.Calculation
    Dim cache As Object: Set cache = CreateObject("Scripting.Dictionary")
    Dim logN As Long: logN = 0
    Dim pass As Long, passes As Long, improved As Boolean
    Dim bestVal As Double, bestSc As Variant, sc As Variant, p As Variant
    Dim c(1 To NV) As Double, k As Long

    On Error GoTo Failed
    Application.EnableCancelKey = xlErrorHandler
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    wsO.Range("B" & LOG0 & ":N" & LOGMAX).ClearContents
    Application.CalculateFull
    WaitCalc

    For pass = 1 To 4
        passes = pass
        improved = False
        For i = 1 To NV
            bestVal = cfg(i)
            bestSc = EvalCfg(cfg, wsD, wsO, dashRow, origD, cache, logN, metric)
            For Each p In lists(i)
                For k = 1 To NV: c(k) = cfg(k): Next k
                c(i) = p
                sc = EvalCfg(c, wsD, wsO, dashRow, origD, cache, logN, metric)
                If Not IsEmpty(sc) Then
                    If IsEmpty(bestSc) Then
                        bestSc = sc: bestVal = p
                    ElseIf sc > bestSc + 0.000000001 Then
                        bestSc = sc: bestVal = p
                    End If
                End If
            Next p
            If bestVal <> cfg(i) Then cfg(i) = bestVal: improved = True
            Application.StatusBar = "Optimointi: kierros " & pass & ", teknologia " & i & "/" & NV & ", " & logN & " kokoonpanoa"
            DoEvents
        Next i
        If Not improved Then Exit For
    Next pass

    SetCfg cfg, wsD, dashRow, origD          ' paras kokoonpano ohjauspaneeliin
    Application.Calculate
    WaitCalc
    Application.Calculation = oldCalc
    Application.StatusBar = False
    Application.ScreenUpdating = True
    Application.EnableCancelKey = xlInterrupt

    wsO.Range("C20").Value = Format(Now, "dd.mm.yyyy hh:nn") & " · mittari: " & metric & _
        " · päälämmitys: " & wsD.Range("D5").Value & " · " & logN & " kokoonpanoa, " & passes & " kierrosta."

    Dim msg As String
    msg = "Optimointi valmis: " & logN & " kokoonpanoa laskettu." & vbCrLf & _
          "Paras kokoonpano on asetettu ohjauspaneeliin."
    If logN > 2 And Application.WorksheetFunction.CountA(wsO.Range("K" & LOG0 & ":K" & LOGMAX)) > 2 Then
        If Application.WorksheetFunction.Max(wsO.Range("K" & LOG0 & ":K" & LOGMAX)) = _
           Application.WorksheetFunction.Min(wsO.Range("K" & LOG0 & ":K" & LOGMAX)) Then
            msg = msg & vbCrLf & vbCrLf & "VAROITUS: kaikilla kokoonpanoilla sama säästö. " & _
                  "Tarkista, että laskenta on automaattinen (Kaavat > Laskennan asetukset) ja aja haku uudelleen."
        End If
    End If
    MsgBox msg, vbInformation, "Kokoonpanon optimointi"
    Exit Sub

Failed:
    Dim errText As String
    If Err.Number = 18 Then errText = "Haku keskeytettiin." Else errText = "Haku pysähtyi virheeseen: " & Err.Description
    On Error Resume Next
    For i = 1 To NV
        wsD.Cells(dashRow(i - 1), "C").Value = origC(i)
        wsD.Cells(dashRow(i - 1), "D").Value = origD(i)
    Next i
    Application.Calculation = oldCalc
    Application.Calculate
    Application.StatusBar = False
    Application.ScreenUpdating = True
    Application.EnableCancelKey = xlInterrupt
    wsO.Range("C20").Value = Format(Now, "dd.mm.yyyy hh:nn") & " · " & errText & " Alkuperäinen kokoonpano palautettu. " & logN & " kokoonpanoa lokissa."
    MsgBox errText & vbCrLf & "Alkuperäinen kokoonpano on palautettu.", vbExclamation, "Kokoonpanon optimointi"
End Sub

Private Sub WaitCalc()
    Do While Application.CalculationState <> xlDone
        DoEvents
    Loop
End Sub

Private Sub SetCfg(cfg() As Double, wsD As Worksheet, dashRow As Variant, origD As Variant)
    Dim i As Long
    For i = 1 To NV
        If cfg(i) > 0 Then
            wsD.Cells(dashRow(i - 1), "C").Value = 1
            wsD.Cells(dashRow(i - 1), "D").Value = cfg(i)
        Else
            wsD.Cells(dashRow(i - 1), "C").Value = 0
            wsD.Cells(dashRow(i - 1), "D").Value = origD(i)
        End If
    Next i
End Sub

Private Function EvalCfg(cfg() As Double, wsD As Worksheet, wsO As Worksheet, dashRow As Variant, _
        origD As Variant, cache As Object, logN As Long, metric As String) As Variant
    Dim key As String, i As Long
    For i = 1 To NV: key = key & cfg(i) & "|": Next i
    If cache.Exists(key) Then EvalCfg = cache(key): Exit Function
    If LOG0 + logN > LOGMAX Then Err.Raise vbObjectError + 513, , "Hakuloki täynnä (" & logN & " kokoonpanoa). Lyhennä ehdokaslistoja."

    SetCfg cfg, wsD, dashRow, origD
    Application.Calculate
    WaitCalc

    Dim sav As Variant, pb As Variant, npv As Variant, tila As String, sc As Variant
    sav = wsD.Range("E51").Value: pb = wsD.Range("E52").Value: npv = wsD.Range("E54").Value
    tila = CStr(wsD.Range("K14").Value)
    sc = Empty
    If tila = "OK" Then
        Select Case metric
            Case "NPV (suurin)": If IsNumeric(npv) Then sc = CDbl(npv)
            Case "Vuotuinen säästö (suurin)": If IsNumeric(sav) Then sc = CDbl(sav)
            Case Else: If IsNumeric(pb) Then sc = -CDbl(pb)
        End Select
    End If

    logN = logN + 1
    Dim r As Long: r = LOG0 + logN - 1
    wsO.Cells(r, "B").Value = logN
    For i = 1 To NV: wsO.Cells(r, 2 + i).Value = cfg(i): Next i
    wsO.Cells(r, "I").Value = wsD.Range("G16").Value
    wsO.Cells(r, "J").Value = wsD.Range("G18").Value
    wsO.Cells(r, "K").Value = sav
    wsO.Cells(r, "L").Value = pb
    wsO.Cells(r, "M").Value = npv
    wsO.Cells(r, "N").Value = tila

    cache.Add key, sc
    EvalCfg = sc
End Function

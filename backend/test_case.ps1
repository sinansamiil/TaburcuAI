$json = '{"disease":"heart_failure","raw_text":"Tani: Kalp yetersizligi. Tedavi: Lasix 40mg sabah 1 adet, Beloc ZOK 25mg sabah 1 adet. Gunluk kilo takibi ve tuz kisitlamasi onerilir. 3 gun icinde 2 kilo artis olursa hekime basvurunuz."}'
$res = Invoke-RestMethod -Uri http://127.0.0.1:8000/api/v1/cases -Method Post -ContentType 'application/json' -Body $json
Write-Host "STATUS ID: " $res.id
Write-Host "STATUS DISEASE: " $res.disease
Write-Host "MEDICATIONS: " ($res.simplified_plan.medications | ConvertTo-Json)

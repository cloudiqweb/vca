[CmdletBinding()]
Param(
    
    [Parameter(Mandatory=$True)]
    [string]$Environment,

    [Parameter(Mandatory=$True)]
    [string]$Version,

    [Parameter(Mandatory=$False)]
    [string]$GAAccount


)

$Build_Location = 'C:\inetpub\VCAChargeCapture';

$BaseRef = 'VCAChargeCapture';

$ConfigFolderPath = $Build_Location + '\assets\config\';

IF($BaseRef -and $BaseRef -ne '') {

    $htmlFilePath = $Build_Location + '\index.html';
    $htmlContent = Get-Content $htmlFilePath;
    $htmlContent = $htmlContent -replace '<base href="/">', ('<base href="/' + $BaseRef + '/">');

    IF($GAAccount -and $GAAccount -ne '') {
        $htmlContent = $htmlContent -replace "var gaTrackingCode = '';", ("var gaTrackingCode = '" + $GAAccount + "';");
    }

    Set-Content $htmlFilePath $htmlContent;
    Write-Host "Updated BaseHref and Ga Account";
}

IF($Environment -and $Environment -ne '') {

    $configJson = Get-Content ($ConfigFolderPath + 'env.json') -raw | ConvertFrom-Json;
    $configJson.env = $Environment;
    $configJson | ConvertTo-Json  | set-content ($ConfigFolderPath + 'env.json');
    Write-Host "Updated Environment";
}

IF($Environment -and $Environment -ne '' -and $Version -and $Version -ne '') {

    $configPath = ($ConfigFolderPath + 'config.' + $Environment + '.json');
    $configJson = Get-Content  $configPath -raw | ConvertFrom-Json;
    $configJson.Version_Number = 'V ' + $Version;
    $configJson | ConvertTo-Json  | set-content $configPath;
    Write-Host "Updated Version";
}
$CurrentBuildNumber =  $env:Build_BuildNumber;
Try {
    if($VersionSuffix -eq $null) {
        $VersionSuffix = "V ";
    }
    if($BaseMajorVersion -eq $null) {
        $BaseMajorVersion = "1";
    }
    if($BaseMinorVersion -eq $null) {
        $BaseMinorVersion = "0";
    }
    $UpdatedBuildNumber = $VersionSuffix + $BaseMajorVersion + "." + $BaseMinorVersion + "." + "0";
    if($CurrentBuildNumber -ne $null -and $CurrentBuildNumber -ne "") {

        $tempBuildNumber = $CurrentBuildNumber.Replace($VersionSuffix, "");
        $tempVersions = $tempBuildNumber.Split('.');

        if($tempVersions.Length -eq 3) {
            $tempMajorVersion = $tempVersions[0];
            $tempMinorVersion = $tempVersions[1];
            $tempRevisionNumber = $tempVersions[2];

            if($tempMajorVersion -ne  $BaseMajorVersion) {
                $tempMajorVersion = $BaseMajorVersion;
                $tempRevisionNumber = "0";
            }

        
            if($tempMinorVersion -ne  $BaseMinorVersion) {
                $tempMinorVersion = $BaseMinorVersion;
                $tempRevisionNumber = "0"
            }

        
            if($tempRevisionNumber -ne  "0") {
                $tempRevisionNumber = ([int]$tempRevisionNumber) + 1;
            }

            $UpdatedBuildNumber = $VersionSuffix + $tempMajorVersion + "." + $tempMinorVersion + "." + $tempRevisionNumber;

        }
    
    }
}
Catch{
    $UpdatedBuildNumber = "V 1.0.0";
}

Write-Host $UpdatedBuildNumber
Write-Host ("##vso[build.updatebuildnumber]$UpdatedBuildNumber")

param([string]$jsonPath)

try {
    # Check if the JSON file exists
    if (-Not (Test-Path -Path $jsonPath)) {
        Throw "JSON file not found at $jsonPath"
    }

    # Load JSON content
    $jsonContent = Get-Content -Raw -Path $jsonPath
    if (-not $jsonContent) {
        Throw "JSON content is empty."
    }
    
    $emailData = $jsonContent | ConvertFrom-Json
    if (-not $emailData) {
         Throw "Failed to parse JSON."
    }

    # Start Outlook Application Com Object
    $outlook = New-Object -ComObject Outlook.Application
    if (-not $outlook) {
         Throw "Failed to start Outlook Application. Is it installed?"
    }

    $mailItem = $outlook.CreateItem(0) # 0 is standard MailItem type

    # Populate email fields
    $mailItem.To = $emailData.to
    if ($emailData.cc) {
        $mailItem.CC = $emailData.cc
    }
    $mailItem.Subject = $emailData.subject
    
    # Using HTMLBody is better for multiline / structured emails
    $mailItem.HTMLBody = $emailData.body

    # Action determine if we just Display draft or Send it automatically
    if ($emailData.action -eq "send") {
        $mailItem.Send()
    } else {
        $mailItem.Display()
    }

    # Signal completion
    Write-Output "Email successfully generated."

} catch {
    Write-Error $_.Exception.Message
    exit 1
} else {
    exit 0
}

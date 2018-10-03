# Table of Contents

1. App Description
2. Installation and Tested Environments
3. Performance Impact
4. Data Source Check Dashboard
5. Detection Methods Used by the Searches
6. Sending Usage Data to Splunk

# App Description

Use Splunk's analytics-driven security for your environment, from security monitoring to detecting insiders and advanced attackers in your environment with this free app. The app uses Splunk Enterprise and the power of our Search Processing Language (SPL) to showcase tons of working examples. 

Each use case has examples with sample data and real searches. We've also included extensive documentation and you can save searches directly from the app to create a Notable Event or Risk Indicator in ES, an External Alarm in UBA, or send an email for review. This gives analysts the ability to detect anomalous activities, leverage best practice detections for small or large environments, even improve your GDPR stance. 

Best of all, SSE provides a map of all Splunk security detections to six stages that represent the Splunk Security Journey and categorizes them by use cases, providing you a maturity path to get you from day one to a thousand. Improve your security, starting now.

# Installation and Tested Environments

## In a single-instance deployment
* If you have internet access from your Splunk server, download and install the app by clicking '''Browse More Apps''' from the Manage Apps page in Splunk platform. 
* If your Splunk server is not connected to the internet, download the app from Splunkbase and install it using the Manage Apps page in Splunk platform. 
Note: If you download the app as a tgz file, Google Chrome could automatically decompress it as a tar file. If that happens to you, use a different browser to download the app file.

## In a distributed deployment
Install the app only on a search head. This app is safe to install in large size clusters, as it will not have an impact on indexers (unless you choose to enable many searches). The app includes many lookups with demo data that shouldn't be replicated to the indexers, but also includes a distsearch.conf file to prevent that replication, so that you needn't worry.

## In a Search Head Cluster deployment
SSE installs into a SHC like any other SHC app, the only area where there is some minimal risk in a SHC setup is when using the Lookup Cache acceleration technique under the First Time Seen detection with very large lookups (See First Time Seen Detection -> Considerations for implementing the large scale version in this doc). This wouldn't be used by default, and even when used would be safe for virtually all scenarios as Search Head Clustering has a robust replication mechanism that works well for larger files. The docs below detail that most SSE lookups using this technique would be a few MB in size, and it's difficult to conceive of a lookup more than 1 GB. I have hunted and the only issue with SHC replication I've found was with a 54 GB KV Store, so you should feel very comfortable using SSE including this technique.

## After installation
Unless you save or enable searches included with the app, there is no increase in indexed data, searches or others. Because the app includes demo data, the app takes about 250MB of storage on the search head. 

## Alongside ES
This app does not interfere or impact ES, and can be installed on an ES Search Head (or Search Head Cluster) safely.

## Tested Platforms
In addition to the above described scenarios, this app is periodically tested with the following client platforms:
* OSX 10.12 (Sierra) - Chrome (Primary)
* OSX 10.12 (Sierra) - Safari
* OSX 10.12 (Sierra) - Firefox
* Windows 10 - Chrome
* Windows 10 - Safari
* Windows 10 - Firefox

# Performance Impact

If you save and enable searches included with the app in your environment, you could see changes in the performance of your Splunk deployment.

As is true for all searches in Splunk, the amount of data that you search affects the search performance you see in your deployment. For example, if you search Windows logs for two desktops, even the most intensive searches in this app add no discernible load to your indexers. If you instead search domain controller logs with hundreds of thousands of users included, you would see additional load. 

The searches included with the app are generally scheduled to run once a day, and leverage acceleration and efficient search techniques wherever possible. In addition, the searches have been vetted by performance experts at Splunk to ensure they are as performant as possible. If you are concerned about resource constraints, schedule any searches you save to run during off-peak times. 

You can also against configure these searches to run against cached or summary index data (see "Large Scale" headers below). If your Splunk deployment is a large scale deployment, use the lookup cache for first time seen searches and select the "High Scale / High Cardinality" option for time series analysis searches. See the details for large scale versions of these searches below. 

# Data Source Check Dashboard

In Splunk Security Essentials, every example with an available search has prerequisites defined, so that you will know whether a given search should work in your environment. (This also gives you some insight into what data sources you might want to add in the future.) When you click "Start Searches," more than sixty searches will launch. Each search is super fast, and the dashboard will throttle to five concurrent searches to minimize impact on your Splunk environment. The searches are highly efficient, so in most environments this entire load should take less than five minutes to run, usually around one and a half minutes. The result will be a chart showing you which use cases you can expect to run smoothly.

# Detection Methods Used by the Searches

The detection methods for the use cases in the app fall into three categories:

* Time series analysis
* First time analysis
* General Splunk searches

## Time Series Searches
This method of anomaly detection tracks numeric values over time and looks for spikes in the numbers. Using the standard deviation in the stats command, you can look for data samples many standard deviations away from the average, allowing you to identify outliers over time. For example, use a time series analysis to identify spikes in the number of pages printed per user, the number of interactive logon sessions per account, and other statistics where if a spike is seen, would indicate suspicious behavior. 

The time series analysis is also performed on a per-entity basis (e.g., per-user, per-system, per-file hash, etc.), leading to more accurate alerts. It is more helpful to know if a user prints more than 3 standard deviations above their personal average, but less useful to alert if more than 150 pages are printed. Using a time series analysis with Splunk, you can detect anomalies accurately. 

The time series searches address use cases that detect spikes, such as "Increase in Pages Printed" or "Healthcare Worker Opening More Patient Records Than Normal" or any other use case you might describe with the word "Increase."

### Large Scale Version of Time Series Searches
In a large-scale data environment, utilize summary indexing for searches of this type. The app allows you to save any time series use case in two ways: 

* Click "Schedule Alert" to detect anomalies directly from raw data. Run this search for low data volumes.
* Click "Schedule High Scale / High Cardinality Alert" to save a version optimized for performance in large-scale deployments, actually including two searches. Run these searches in a large-scale environment to take advantage of summary indexing.

For the High Scale / High Cardinality versions, the app schedules two searches. One search aggregates activity every day and stores that daily summary in a summary index. The second search actually does the anomaly detection, but rather that reviewing every single raw event it reviews the summary indexed data. This allows that search to analyze more data (such as terabytes instead of gigabytes), and a greater number of values (such as 300k usernames rather than 3k usernames). 

For example, the small-scale version of the "Healthcare Worker Opening More Patient Records Than Normal" search runs across a time range and reviews raw events for each healthcare worker to pull the number of unique patient records per day, and then calculates the average and standard deviation all in one. If you use the large-scale version, the first search runs every day to calculate how many patient records were viewed yesterday, and then outputs one record per worker with a username, timestamp, and the number of patient records viewed for each healthcare worker to a summary index. Then the large-scale version of the search would run against the summary indexed data to calculate the average, standard deviation, and most recent value.

#### Considerations for implementing the large scale version
With lower cardinality to manage in the dataset and fewer raw records to retrieve each day, the amount of data that the Splunk platform has to store in memory is reduced, leading to better search performance and reduced indexer load. 

However, summary indexing means that you have to manage two scheduled searches instead of just one. In addition, the data integrity of the summary index relies on the summary indexing search not being skipped. Summary indexed data also takes up storage space on your indexers, though generally not very much, and summary indexed data does not count against your Splunk license. 

For more on how to use summary indexing to improve performance, see http://www.davidveuve.com/tech/how-i-do-summary-indexing-in-splunk/. 

## First Time Seen Searches
First time analysis detects the first time that an action is performed. This helps you identify out of the ordinary behavior that could indicate suspicious or malicious activity. For example, service accounts typically log in to the same set of servers. If a service account logs into a new device one day, or logs in interactively, that new behavior could indicate malicious activity. You typically want to see an alert of first time behavior if the last time that this activity has been seen is within the last 24 hours. 

You can also perform first time analysis based on a peer group with this app. Filter out activity that is new for a particular person, but not for the people in their group or department. For example, if John Seyoto hasn't checked out code from a particular git repo before, but John's teammate Bob regularly checks out code from that repo, that first time activity might not be suspicious. 

Detect first time behavior with the stats command and first() and last() functions. Integrate peer groups first seen activity using eventstats. In the app, the demo data compares against the most recent value of latest(), rather than "now" because events do not flow into the demo data in real time so there is no value for "now."

The ability to detect first time seen behavior is a major feature of many security data science tools on the market, and you can replicate it with these searches in the Splunk platform out of the box, for free. 

The first time seen searches address use cases that detect new values, such as the "First Logon to New Server" or "New Interactive Logon from Service Account" or any other search with "New" or "First" in the name.

### Large Scale Version of First Time Seen Searches
In a large-scale deployment, use caching with a lookup for searches of this type. If you select a lookup from the "(Optional) Lookup to Cache Results" dropdown, it will automatically configure the search to use that lookup to cache the data. If you leave the value at "No Lookup Cache" then it will run over the raw data. 

For example, to detect new interactive logons by service account, you would need to run a search against raw events with a time window of 30, 45, or even 100 days. The search might run against several tens of millions of events, and depending on the performance you expect from the search, it might make sense to cache the data locally. 

The more performant version of these searches rely on a lookup to cache the historical data. The search then runs over the last 24 hours, adds the historical data from the lookup to recompute the earliest and latest times, updates the cache in the lookup, and finds the new values.

#### Considerations for implementing the large scale version
Implementing historical data caching can improve performance. For a baseline data comparison of 100 days, and assuming that some of that data is in cold storage, historical data caching could improve performance up to 100 times. 

Relying on a cache also means storing a cache. The caches are stored in CSV lookup files stored on a search head. The more unique combinations of data that need to be stored, the more space needed on a search head. If a lookup has 300 million combinations to store, that lookup file can take up 230MB of space. If you implement the large-scale version of the searches, ensure that there is available storage on the search head for the lookups needed to provide historical data caching for these searches.  

Lookups in this app are excluded from bundle replication to your indexers. This prevents your bundles from getting too large, and maintains Splunk reliability. However, if you move the searches or lookups to a different app, our configurations won't protect them. In this case, make sure you replicate the settings in distsearch.conf so that those lookups are not distributed to the indexers. The risks associated with large bundles are that it can take longer for changes to go into effect, and in extreme cases can even take indexers offline (bundles too out of date).

## General Splunk Searches
The remainder of the searches in the app are straightforward Splunk searches. The searches rely on tools included in Splunk platform to perform anomaly detection, such as the URL toolbox to detect Shannon entropy in URLs, the Levenshtein distance to identify filename mismatches, the transaction command to perform detection, and more. They typically don't require a historical baseline of data, so can be run over the last half hour of data easily. You can get the most value from these searches if you copy-paste the raw search strings into your Splunk deployment and start using them.

# Sending Usage Data to Splunk
## Why we collect data
Splunk Security Essentials is a free app, and because of that we often don't really know what people care about in the app. We've got lots of ideas for what we should build next, but we want to know what people find valuable. For customers who opt in, collecting data tells us what you care about! For example, we are shipping some Data Onboarding Guides. How often people actually use these will help us to know whether it's worth it to build more. Everything is anonymized, so you info is always private.

## How data is collected
If you opt in globally on your Splunk environment, the app enables an internal library to track basic usage and crash information. The library uses browser cookies to track app user visitor uniqueness and sessions and sends events to Splunk using XHR in JSON format, with all user or system identifying data resolved to GUIDs.

## What we collect
| Event                      | Description                                                 | Example Fields in addition to Common Fields                                                                      |
| -------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Example Opened             | You were interested enough to open an example               | status - exampleLoaded; exampleName - the name from the contents; searchName - which search for that example.    |
| SPL Viewed                 | You though the SPL for an example was worth seeing!         | status - SPLViewed; name - the searchName from row 1                                                             |
| Schedule Search (Started)  | An example so useful that you decided to schedule an alert  | status - scheduleAlertStarted; name - the searchName from row 1                                                  |
| Schedule Search (Finished) | An example so useful you actually scheduled an alert!       | status - scheduleAlertCompleted; name - the searchName from row 1                                                |
| Doc Loaded                 | You were curious about onboarding and opened a guide        | status - docLoaded; pageName - whatever page you are viewing (e.g., Windows Security Logs)                       |
| Filters Updated            | You updated your filters to filter for specific examples    | status - filtersUpdated; name - the filter you change; value - the value; enabledFilters - the filters in use    |  
| Selected Intro Use Case    | From the intro page, you clicked on a use case for more     | status - selectedIntroUseCase; useCase - whatever you clicked on, like "Security Monitoring"                     |
| Added to Bookmark          | You wanted to remember an example, and added to a wish list | status - BookmarkChange; name - what you clicked on; itemStatus - what choice you made (e.g., "inQueue")         |

## Example Collections
| Event                      | Example Message                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Example Opened             | {status: "exampleLoaded", exampleName: "New Interactive Logon from a Service Account", searchName: "New Interactive Logon from a Service Account - Demo"}                      |
| SPL Viewed                 | {status: "SPLViewed", name: "New Interactive Logon from a Service Account - Demo"}                                                                                             |
| Schedule Search (Started)  | {status: "scheduleAlertStarted", name: "New Interactive Logon from a Service Account - Demo"}                                                                                  |
| Schedule Search (Finished) | {status: "scheduleAlertCompleted", searchName: "New Interactive Logon from a Service Account - Demo"}                                                                          |
| Doc Loaded                 | {status: "docLoaded", pageName: "Windows Security Logs"}                                                                                                                       |
| Filters Updated            | {status: "filtersUpdated", name: "category", value: "Account_Sharing", enabledFilters: ["journey", "usecase", "category", "datasource", "highlight"]}                          |  
| Selected Intro Use Case    | {status: "selectedIntroUseCase", useCase: "Security Monitoring"}                                                                                                               |
| Added to Bookmark          | {status: "BookmarkChange", name: "Basic Malware Outbreak", itemStatus: "needData"}                                                                                                               |

## Opting in or out
When first installing Splunk (or upgrading to a version of Splunk that supported usage data collection) an administrator was asked whether to opt in or not. That setting can be viewed or changed (aka, you can opt in/out) by enabling/disabling Anonymized Usage Data under Settings > Instrumentation on the Splunk Web UI. 

## What are Common Fields
Splunk itself sends some usage data (again, if you've opt'd in). Splunk Security Essentials doesn't touch that stuff, but you can go read about it here: https://docs.splunk.com/Documentation/Splunk/latest/Admin/Shareperformancedata


const User = require('../models/User');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Checking if database seeding is required...');

    // 1. Seed User
    let testUser = await User.findOne({ email: 'cso@trace.ai' });
    if (!testUser) {
      console.log('[Seeder] Seeding default operator user...');
      testUser = new User({
        fullName: 'Chief Security Officer',
        email: 'cso@trace.ai',
        password: 'clearancepassword123',
        role: 'Admin',
        department: 'TRACE Security Command'
      });
      await testUser.save();
    }

    // 2. Seed Cases
    const caseCount = await Case.countDocuments();
    if (caseCount === 0) {
      console.log('[Seeder] Seeding initial incident response cases...');
      const casesData = [
        {
          caseId: 'DF-1001',
          title: 'Brute-Force Attack: SSH-Gate-04',
          description: 'Observed repetitive authentication failures on port 22 matching brute force pattern.',
          severity: 'Critical',
          status: 'Open',
          assignedAnalyst: 'V. Petrov',
          sourceIP: '198.51.100.42',
          destinationIP: '10.0.0.12',
          evidenceCount: 3,
          createdBy: testUser._id,
          targetHost: 'SSH-GATE-04',
          createdAt: new Date(Date.now() - 4 * 3600 * 1000)
        },
        {
          caseId: 'DF-1002',
          title: 'Data Exfiltration Alpha detected in S3',
          description: 'Anomalous outbound payload of 45GB transfer logged over non-standard TLS port.',
          severity: 'High',
          status: 'Investigating',
          assignedAnalyst: 'K. Sato',
          sourceIP: '10.0.4.150',
          destinationIP: '203.0.113.88',
          evidenceCount: 8,
          createdBy: testUser._id,
          targetHost: 'STORAGE-S3-BLOB',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000)
        },
        {
          caseId: 'DF-1003',
          title: 'Suspicious PowerShell Execution',
          description: 'Base64 encoded launch arguments discovered in local event logs.',
          severity: 'Medium',
          status: 'Open',
          assignedAnalyst: 'Autonomous',
          sourceIP: '192.168.1.45',
          destinationIP: '192.168.1.1',
          evidenceCount: 1,
          createdBy: testUser._id,
          targetHost: 'WS-EDR-209',
          createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
        },
        {
          caseId: 'DF-1004',
          title: 'Cryptomining pattern on K8s cluster',
          description: 'Unusual CPU spikes matching mining algorithm observed on namespace dev-staging.',
          severity: 'Medium',
          status: 'Closed',
          assignedAnalyst: 'L. Chen',
          sourceIP: '10.244.0.12',
          destinationIP: '198.51.100.77',
          evidenceCount: 2,
          createdBy: testUser._id,
          targetHost: 'K8S-CLUSTER-01',
          createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
          updatedAt: new Date(Date.now() - 9 * 24 * 3600 * 1000)
        }
      ];
      await Case.insertMany(casesData);
    }

    // 3. Seed Audit Logs
    const logCount = await AuditLog.countDocuments();
    if (logCount === 0) {
      console.log('[Seeder] Seeding initial audit activities...');
      const logs = [
        {
          logId: 'LOG-1001',
          eventId: 'LOG-1001',
          user: 'cso@trace.ai',
          role: 'Admin',
          action: 'Operator login success',
          module: 'AUTH',
          resource: 'User Session',
          ipAddress: '192.168.1.10',
          ip: '192.168.1.10',
          device: 'desktop',
          browser: 'Chrome 122',
          status: 'Success',
          severity: 'Low',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          description: 'Chief Security Officer logged into the central console via multi-factor credentials.'
        },
        {
          logId: 'LOG-1002',
          eventId: 'LOG-1002',
          user: 'attacker@scam.org',
          role: 'Investigator',
          action: 'Unauthorized privilege escalation attempt',
          module: 'ACCESS',
          resource: 'IAM User Config',
          ipAddress: '198.51.100.99',
          ip: '198.51.100.99',
          device: 'server',
          browser: 'Python Requests',
          status: 'Failed',
          severity: 'Critical',
          timestamp: new Date(Date.now() - 12 * 60 * 1000),
          description: 'A suspicious API key escalate command was rejected from an untrusted subnet.'
        },
        {
          logId: 'LOG-1003',
          eventId: 'LOG-1003',
          user: 'cso@trace.ai',
          role: 'Admin',
          action: 'Suspicious PowerShell execution blocked',
          module: 'EDR',
          resource: 'WS-EDR-209 Host',
          ipAddress: '192.168.1.45',
          ip: '192.168.1.45',
          device: 'workstation',
          browser: 'EDR Daemon',
          status: 'Success',
          severity: 'High',
          timestamp: new Date(Date.now() - 32 * 60 * 1000),
          description: 'PowerShell runtime blocked launch of Base64 encoded payload shell commands.'
        },
        {
          logId: 'LOG-1004',
          eventId: 'LOG-1004',
          user: 'system_daemon',
          role: 'Analyst',
          action: 'Evidence integrity verification completed',
          module: 'FORENSICS',
          resource: 'Evidence DB',
          ipAddress: '127.0.0.1',
          ip: '127.0.0.1',
          device: 'server',
          browser: 'Node CLI',
          status: 'Success',
          severity: 'Low',
          timestamp: new Date(Date.now() - 48 * 60 * 1000),
          description: 'SHA-256 integrity hash verification matched the baseline for files in case DF-1001.'
        },
        {
          logId: 'LOG-1005',
          eventId: 'LOG-1005',
          user: 'system_daemon',
          role: 'Analyst',
          action: 'Malicious outbound network C2 connection blocked',
          module: 'FIREWALL',
          resource: 'SSH-GATE-04 Network',
          ipAddress: '10.0.0.12',
          ip: '10.0.0.12',
          device: 'firewall',
          browser: 'Linux Kernel',
          status: 'Success',
          severity: 'High',
          timestamp: new Date(Date.now() - 65 * 60 * 1000),
          description: 'Egress traffic filtered outbound connection to known C2 server address 198.51.100.77.'
        }
      ];

      // Add 20 more records for robust search, filter, and pagination checks
      const userList = ['j.valdes', 's.keller', 'm.chen', 'd.wright', 'system_daemon'];
      const modules = ['CASES_V2', 'CORE_AUTH', 'DATA_INGEST', 'SOC_ALERTS', 'SYS_HEALTH', 'ENDPOINT_PROT'];
      const actions = ['Investigation Started', 'Config Change Rejected', 'Evidence Uploaded', 'Global Logs Exported', 'Database Limit Audited'];
      const severities = ['Low', 'Medium', 'High', 'Critical'];
      
      for (let i = 1; i <= 20; i++) {
        const rndUser = userList[i % userList.length];
        const rndMod = modules[i % modules.length];
        const rndAct = actions[i % actions.length];
        const rndSev = severities[i % severities.length];
        const status = i % 4 === 0 ? 'Failed' : 'Success';
        
        logs.push({
          logId: `LOG-${1005 + i}`,
          eventId: `LOG-${1005 + i}`,
          user: rndUser,
          role: rndUser === 'd.wright' ? 'Security Director' : rndUser === 's.keller' ? 'SysAdmin' : 'Investigator',
          action: rndAct,
          module: rndMod,
          resource: `Resource-${100 + i}`,
          ipAddress: `192.168.1.${100 + i}`,
          ip: `192.168.1.${100 + i}`,
          device: 'desktop_windows',
          browser: 'Chrome 122',
          status: status,
          severity: rndSev,
          timestamp: new Date(Date.now() - (i + 1) * 3600 * 1000),
          description: `Activity description for log entry #${1005 + i} covering module ${rndMod}.`
        });
      }

      await AuditLog.insertMany(logs);
    }

    // 4. Seed Notifications
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      console.log('[Seeder] Seeding initial notifications...');
      const notifs = [
        { 
          title: 'Critical Incident Logged', 
          message: 'SSH-Gate-04 has triggered brute force alarms.', 
          type: 'Critical', 
          priority: 'High', 
          userId: testUser._id, 
          isRead: false 
        },
        { 
          title: 'Exfiltration Warning', 
          message: 'Anomalous outbound bandwidth spike detected.', 
          type: 'Warning', 
          priority: 'High', 
          userId: testUser._id, 
          isRead: false 
        },
        { 
          title: 'Credential Leak Drill', 
          message: 'Analyst S. Rivera launched mock phishing verification.', 
          type: 'Info', 
          priority: 'Low', 
          userId: testUser._id, 
          isRead: true 
        },
        {
          title: 'System Diagnostics Success',
          message: 'Automatic memory integrity checks completed successfully.',
          type: 'Success',
          priority: 'Low',
          userId: testUser._id,
          isRead: false
        }
      ];
      for (const notif of notifs) {
        const doc = new Notification(notif);
        await doc.save();
      }
    }

    console.log('[Seeder] Database seeding check completed.');
  } catch (err) {
    console.error(`[Seeder] Error checking or seeding: ${err.message}`);
  }
};

module.exports = seedDatabase;

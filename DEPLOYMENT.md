# CodeCampus — AWS Deployment (low-cost, single instance)

Everything (MySQL **+** Spring Boot backend with all 5 compilers **+** React frontend) runs in
Docker on **one small EC2 instance**. Provisioned with **Terraform**.

**Why this layout?** It deliberately avoids the AWS services that cost the most:

| Avoided (expensive) | Used instead (cheap) |
|---|---|
| RDS managed database | MySQL container on the instance (data on the EBS volume) |
| Application Load Balancer (~$16/mo) | nginx in a container on port 80 |
| NAT Gateway (~$32/mo) | default VPC public subnet (no NAT) |
| CloudFront | nginx serves the static frontend |

**Estimated cost:** ~**$8/mo** on `t3.micro` or ~**$16/mo** on `t3.small` (recommended for reliable builds),
plus ~$2/mo for the 20 GB disk. With your **$100 credits** that's roughly **6–12 months free**.

```
                Internet
                   │  http (port 80)
                   ▼
        ┌─────────────────────────────┐
        │      EC2 (t3.small)          │
        │  ┌────────┐  ┌───────────┐   │
        │  │ nginx  │→ │ backend   │   │   nginx serves React,
        │  │ (web)  │  │ (8080)    │   │   proxies /api → backend
        │  └────────┘  └─────┬─────┘   │
        │                ┌───┴────┐    │
        │                │ MySQL  │    │   data on EBS volume
        │                └────────┘    │
        └─────────────────────────────┘
```

---

## What YOU provide (I don't need your AWS keys)

I cannot and should not take your AWS secret keys. You run two Terraform commands with your own
credentials. You only need:

1. **AWS Access Key + Secret** — create at AWS Console → IAM → your user → *Security credentials* →
   *Create access key*. (Or use an admin IAM user.)
2. **An SSH public key** (optional, for logging into the box):
   `ssh-keygen -t ed25519 -C "codecampus"` → copy `~/.ssh/id_ed25519.pub`.
3. A **DB password** you choose.

That's it. Everything else (VPC, instance, IP, building & running the app) is automated.

---

## One-time setup on your machine

Install:
- **Terraform** — https://developer.hashicorp.com/terraform/install
- **AWS CLI** — https://aws.amazon.com/cli/

Then authenticate:
```bash
aws configure
# AWS Access Key ID:     <paste>
# AWS Secret Access Key: <paste>
# Default region name:   eu-north-1
# Default output format:  json
```

---

## Deploy (from the repo's `terraform/` folder)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # then edit it
```

Edit `terraform.tfvars` — set at least `db_password`, and paste your `ssh_public_key`.
Optionally set `instance_type = "t3.micro"` for the cheapest option.

```bash
terraform init
terraform apply        # review the plan, type: yes
```

When it finishes, Terraform prints:
```
app_url     = "http://<your-public-ip>"
ssh_command = "ssh ec2-user@<your-public-ip>"
```

> ⏳ The instance then **builds the Docker images on first boot** (Maven + Vite). This takes about
> **8–12 minutes** after `apply` completes. Until it's done, the URL won't load yet — be patient.

### Check progress (optional)
```bash
ssh ec2-user@<your-public-ip>
sudo docker ps                                   # all 3 containers should appear
sudo docker compose -f /opt/app/deploy/docker-compose.yml logs -f backend
```

---

## After it's up

1. Open `http://<your-public-ip>` in the browser.
2. Log in with a demo account: **`student` / `student123`**.
3. Open a problem → **Run / Submit** in Java, Python, JavaScript (and C/C++ — all compilers are in the container).

The database auto-creates tables and seeds the 191 problems, batches, and demo users on first boot.

---

## Updating the app later

Push changes to GitHub, then on the instance:
```bash
ssh ec2-user@<your-public-ip>
cd /opt/app && sudo git pull
cd deploy && sudo docker compose up -d --build
```

## Tearing it down (stop all charges)
```bash
cd terraform
terraform destroy      # type: yes
```
This deletes the instance, disk, IP, and security group — billing stops.

---

## Cost-control tips
- Use `t3.micro` for the lowest hourly cost (builds are slower; a 2 GB swap file is created to help).
- Run `terraform destroy` whenever you're not demoing — you only pay while the instance runs.
- Watch **AWS Console → Billing → Free plan status** to track your $100 credit.

## Security notes
- HTTP only (no domain/TLS). Fine for a demo; add a domain + HTTPS (e.g. Caddy/nginx + Let's Encrypt) for real use.
- SSH is locked to `allowed_ssh_cidr` if you set it to `YOUR_IP/32`.
- Executing untrusted user code is inherently risky; this is a demo-grade setup. For production, isolate
  execution (resource limits, disable network egress from user code) — see `docs/HLD.md`.

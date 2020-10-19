---
description: Appsmith stands for speed and getting started with Appsmith is just as fast.
---

# Getting started

You can begin using appsmith via our cloud instance or by deploying appsmith yourself

* [Using Appsmith Cloud](quick-start.md#appsmith-cloud) **\(recommended\):** Create a new application with just one click
* [Using Docker](quick-start.md#docker): Deploy anywhere using docker

## Appsmith Cloud

The fastest way to get started with appsmith is using our cloud-hosted version. It's as easy as

1. [Create an Account](https://app.appsmith.com/user/signup)
2. [Start Building](core-concepts/building-the-ui/)

## Prerequisites
* Ensure `kubectl` is installed and configured to connect to your cluster
    * Install kubeclt: [kubernetes.io/vi/docs/tasks/tools/install-kubectl/](https://kubernetes.io/vi/docs/tasks/tools/install-kubectl/)
    * Minikube: [Setup Kubectl](https://minikube.sigs.k8s.io/docs/handbook/kubectl/)
    * Google Cloud Kubernetes: [Configuring cluster access for kubectl
](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl)
    * Aws EKS: [Create a kubeconfig for Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/create-kubeconfig.html)
    
    * Microk8s: [Working with kubectl](https://microk8s.io/docs/working-with-kubectl)
* Kubernetes NGINX Ingress Controller must be enable on your cluster by default
    * Minikube: [Set up Ingress on Minikube with the NGINX Ingress Controller](https://kubernetes.io/docs/tasks/access-application-cluster/ingress-minikube/)
    * Google Cloud Kubernetes: [Ingress with NGINX controller on Google Kubernetes Engine](https://cloud.google.com/community/tutorials/nginx-ingress-gke)
    * Microk8s: [Add on: Ingress](https://microk8s.io/docs/addon-ingress)
* Script tested on Minikube with Kubernetes v1.19.0

## Kubernetes

Appsmith also comes with an installation script that will help you configure Appsmith & deploy your app on Kubernetes cluster.


1. Fetch the **install.k8s.sh** script on the system you want to deploy appsmith

```bash
# Downloads install.sh
curl -O https://raw.githubusercontent.com/appsmithorg/appsmith/feature/k8s-deployment/deploy/k8s/install.k8s.sh
```

2. Make the script executable

```bash
chmod +x install.k8s.sh
```

3. Run the script.

```bash
./install.k8s.sh
```

4. Check if all the pods are running correctly.

```bash
kubectl get pods

#Output should look like this
NAME                                        READY   STATUS      RESTARTS    AGE
appsmith-editor-cbf5956c4-2zxlz             1/1     Running     0           4m26s
appsmith-internal-server-d5d555dbc-qddmb.   1/1     Running     2           4m22s
imago-1602817200-g28b2                      1/1     Running     0           4m39s
mongo-statefulset-0                         1/1     Running     0           4m13s
redis-statefulset-0                         1/1     Running     0           4m00s
```

{% hint style="success" %}
* You can access the running application on the **Ingress Endpoint**.
```
kubectl get ingress
NAME               CLASS    HOSTS   ADDRESS          PORTS   AGE
appsmith-ingress   <none>   *       192.168.99.102   80      2m
```
* You may need to wait 2-3 minutes before accessing the application to allow application start (depends on your cluster).
{% endhint %}


### Custom Domains

To host Appsmith on a custom domain, you can contact your domain registrar and update your DNS records. Most domain registrars have documentation on how you can do this yourself.

* [GoDaddy](https://in.godaddy.com/help/create-a-subdomain-4080)
* [Amazon Route 53](https://aws.amazon.com/premiumsupport/knowledge-center/create-subdomain-route-53/)
* [Digital Ocean](https://www.digitalocean.com/docs/networking/dns/how-to/add-subdomain/)
* [NameCheap](https://www.namecheap.com/support/knowledgebase/article.aspx/9776/2237/how-to-create-a-subdomain-for-my-domain)
* [Domain.com](https://www.domain.com/help/article/domain-management-how-to-update-subdomains)

## Troubleshooting

If at any time you encounter an error during the installation process, reach out to **support@appsmith.com** or join our [Discord Server](https://discord.com/invite/rBTTVJp)

If you know the error and would like to reinstall Appsmith, simply delete the installation folder and the templates folder and execute the script again


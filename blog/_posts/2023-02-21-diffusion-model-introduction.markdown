---
layout: post
title:  "Diffusion Model 입문하기"
date:   2023-02-21 09:03:00 +0900
categories: jekyll update
---
### 들어가기전에
- 이 글은 딥러닝 감수성은 있지만 디퓨전 감수성이 부족한 사람들을 위해 쓰이는 글
- 컴퓨터 비전 분야의 직관 기반 연구 논문은 잘 읽을 수 있는데, 디퓨전의 경우 이론이 너무 어려워서 어떻게 접근해야할지 모르겠는 사람을 위한 글
- 디퓨전 모델을 가지고 이것저것 해보고 싶은데 from-scratch부터 시작하려니 감이 안 잡히는 사람을 위한 글

### 이론
시작은 YouTube, 그리고 Survey 논문으로 하는 게 좋다. 우선 아래의 YouTube 영상들은 깊이에는 한계가 있지만 전반적인 그림을 그리기 좋다.

- Tutorial on Denoising Diffusion-based Generative Modeling: Foundations and Applications, [Link](https://youtu.be/cS6JQpEY9cs): NVIDIA에서 진행한 CVPR 2022 tutorial 영상
- Diffusion Model 수학이 포함된 tutorial - 디퓨전영상올려야지, [Link](https://youtu.be/uFoGaIVHfoE): 연세대학교 어영정 교수님 연구실의 [권민기](https://kwonminki.github.io/)라는 분이 올린 영상
- [Paper Review] Denoising Diffusion Probabilistic Models, [Link](https://youtu.be/_JQSMhqXw-4): 고대 산경공 석사과정 김정섭 님이 발표하신 영상, 근래의 Diffusion 시대를 연 첫 논문인 DDPM을 소개한다

하지만 Diffusion이 왜 잘 동작하는지에 대해서는 3가지 정도의 View가 있고 이 각각을 배우기 위해서는 역시 Survey 논문 등을 통해 접근하는 게 좋다.

- Yang, L., Zhang, Z., Song, Y., Hong, S., Xu, R., Zhao, Y., ... & Yang, M. H. (2022). Diffusion models: A comprehensive survey of methods and applications. arXiv preprint [arXiv:2209.00796](https://arxiv.org/abs/2209.00796). 
- Croitoru, F. A., Hondru, V., Ionescu, R. T., & Shah, M. (2022). Diffusion models in vision: A survey. arXiv preprint [arXiv:2209.04747](https://arxiv.org/abs/2209.04747).

기존에 VAE 등의 생성 모델에 익숙하다면 먼저 Variational Inference의 관점에서 DDPM의 수렴을 증명할 수 있다. 그리고 이게 어느 정도 따라가진다면 아래의 글과 그 글에 포함된 레퍼런스들을 통해서 Score-based Generative Model과의 연관성, Stocastic Differential Equation과 Langevin Dynamics와의 연관성을 공부해볼 수 있다.

- Generative Modeling by Estimating Gradients of the Data Distribution - Yang Song Blog, [Link](https://yang-song.net/blog/2021/score/)
- What are Diffusion Models? - Lil'Log, [Link](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/)

사실 나는 처음에 이게 잘 되지 않았는데, 전반적으로 손으로 받아써가며 5~6회독 정도 하니까 흐름은 따라갈 수 있었다.

<table>
  <thead>
    <tr>
      <th><img src="https://velog.velcdn.com/images/bismute/post/bb0e4d35-5a90-4d57-9e19-b57042eda1bc/image.png"/></th>
      <th><img src="https://velog.velcdn.com/images/bismute/post/9dee4165-0091-4ec8-96cc-962ec95bc1a8/image.png"/></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="2"><center>안타깝지만 이런 방법은 없다</center></td>
    </tr>
  </tbody>
</table>

그 다음 아래의 구현을 위해서 필수적으로 follow-up 해야할 논문은 우선 아래 정도인 것 같다.

- Ho, J., Jain, A., & Abbeel, P. (2020). Denoising diffusion probabilistic models. Advances in Neural Information Processing Systems, 33, 6840-6851. [Link](https://arxiv.org/abs/2006.11239)
- Song, J., Meng, C., & Ermon, S. (2020). Denoising diffusion implicit models. ICLR 2021. [Link](https://arxiv.org/abs/2010.02502)
- Nichol, A. Q., & Dhariwal, P. (2021, July). Improved denoising diffusion probabilistic models. In International Conference on Machine Learning (pp. 8162-8171). PMLR. [Link](https://arxiv.org/abs/2102.09672)
- Dhariwal, P., & Nichol, A. (2021). Diffusion models beat gans on image synthesis. Advances in Neural Information Processing Systems, 34, 8780-8794. [Link](https://arxiv.org/abs/2105.05233)
- Ho, J., & Salimans, T. (2022). Classifier-free diffusion guidance. NeurIPS 2021 Workshop. [Link](https://arxiv.org/abs/2207.12598)
- Nichol, A., Dhariwal, P., Ramesh, A., Shyam, P., Mishkin, P., McGrew, B., ... & Chen, M. (2021). Glide: Towards photorealistic image generation and editing with text-guided diffusion models. arXiv preprint arXiv:2112.10741. [Link](https://arxiv.org/abs/2112.10741)
- Rombach, R., Blattmann, A., Lorenz, D., Esser, P., & Ommer, B. (2022). High-resolution image synthesis with latent diffusion models. In Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (pp. 10684-10695). [Link](https://arxiv.org/abs/2112.10752)

### 구현
컴퓨터과학자의 훌륭한 덕목 중 하나는 어떤 개념을 받아들였을 때 그걸 구현할 줄 아는 것이라고 생각한다. 그러기 위해서는 처음부터 기깔나는 성능의 코드 베이스가 아닌 from-scratch 구현에 강인해져야한다. 그리고 아래의 링크는 그 시작점이 될 수 있는 코드다.

- awjuliani/pytorch-diffusion/model.py, [Link](https://github.com/awjuliani/pytorch-diffusion/blob/master/model.py): pytorch-lightning 기반으로 가장 간단하게 DDPM 비스무리한 것을 구현했다. MNIST, CIFAR-10 등에서 동작하지만, 수렴속도, 성능에 한계가 있지만... 다양한 시도를 해보면서 diffusion 감수성을 키울 수 있다. 그리고 무엇보다 위의 논문 리스트 중 맨 첫번째 논문만 읽어보고 시도해볼 수 있다.

<table>
  <thead>
    <tr>
      <th><img src="https://velog.velcdn.com/images/bismute/post/1826dac8-dd2f-4bcc-b448-83ed838f42bb/image.png"/></th>
      <th><img src="https://velog.velcdn.com/images/bismute/post/0b381a98-cf1e-4059-a2e7-e3af4e1968f2/image.png"/></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="2"><center>매우 간단하고 직관적인 코드</center></td>
    </tr>
  </tbody>
</table>

위의 코드베이스를 가지고 놀면서 '되는 것' 그리고 '안 되는 것'들을 느꼈다면 다음 스텝은 이거라고 생각한다. (사실 연구가 급하면 처음부터 아래의 코드베이스를 활용하는 게 좋다)

- openai/guided-diffusion/gaussian_diffusion.py, [Link](https://github.com/openai/guided-diffusion/blob/main/guided_diffusion/gaussian_diffusion.py): [hojonathanho/diffusion](https://github.com/hojonathanho/diffusion/blob/1e0dceb3b3495bbe19116a5e1b3596cd0706c543/diffusion_tf/diffusion_utils_2.py)의 tensorflow 구현을 거의 그대로 pytorch스럽게 바꾸어 놓았다. 위의 코드 베이스에 자연스럽게 결합될 수 있으며, 논문 리스트들의 내용이 거의다 반영되어 있거나, 쉽게 반영할 수 있다.

### 마치며
항상 velog 글을 쓸 때는 마지막쯤 급하게 마무리하게 되는 거 같은데, 원래는 디퓨전 모델 Trouble & Shooting을 쓰고 싶었지만... 너무 많은 거 같다. 이런 건 나중에 논문에 써야지 🤣

추가적으로 이건 Diffusion 관련 내가 만든 세미나 슬라이드들

- [230103 - Introduction to Diffusion Models](https://docs.google.com/presentation/d/1L6CmH_TrDz-ra5DsWKgo6w3ixP0G7kbO8FmsUBKbg-0/edit?usp=sharing)
- [20230926 - Introduction to Diffusion Models](https://docs.google.com/presentation/d/1P-7vkBox87qGkaKua5QGAWkn23ktez_-yZcsu9tO9bs/edit?usp=sharing)
- [20230918 - How to utilize StableDiffusion?](https://docs.google.com/presentation/d/1JlQMS-H9ZQTtZl_8QvOHeEmddwvxI3yZZsvHdxYsEug/edit?usp=sharing)